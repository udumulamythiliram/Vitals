import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit
from app.pipeline.reference_engine import parse_reference_range

router = APIRouter(prefix="/api/trends", tags=["trends"])

class VitalMeasurementCreate(BaseModel):
    patient_id: str
    measurement_type: str # blood_pressure | glucose | pulse | weight
    value: float
    value_secondary: Optional[float] = None
    unit: str

@router.get("/lab-trends")
def get_lab_trends(patient_id: str, test_name: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    if test_name:
        cursor.execute("""
            SELECT id, test_name, value, unit, reference_range, flag, collection_date, report_date, document_id
            FROM observations
            WHERE patient_id = ? AND LOWER(test_name) LIKE ?
            ORDER BY collection_date ASC
        """, (patient_id, f"%{test_name.lower()}%"))
    else:
        cursor.execute("""
            SELECT id, test_name, value, unit, reference_range, flag, collection_date, report_date, document_id
            FROM observations
            WHERE patient_id = ?
            ORDER BY collection_date ASC
        """, (patient_id,))

    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Group by test name
    grouped: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        t_name = r["test_name"]
        if t_name not in grouped:
            ref_min, ref_max = parse_reference_range(r["reference_range"])
            grouped[t_name] = {
                "test_name": t_name,
                "unit": r["unit"],
                "reference_range": r["reference_range"],
                "ref_min": ref_min,
                "ref_max": ref_max,
                "points": []
            }
        grouped[t_name]["points"].append({
            "date": r["collection_date"] or r["report_date"] or "Latest",
            "value": r["value"],
            "flag": r["flag"],
            "document_id": r["document_id"]
        })

    return list(grouped.values())

@router.get("/compare-reports")
def compare_reports(patient_id: str, doc_id_1: str, doc_id_2: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, original_filename, created_at FROM documents WHERE id IN (?, ?)", (doc_id_1, doc_id_2))
    docs = {d["id"]: dict(d) for d in cursor.fetchall()}

    cursor.execute("SELECT test_name, value, unit, reference_range, flag, collection_date, document_id FROM observations WHERE document_id IN (?, ?)", (doc_id_1, doc_id_2))
    obs = cursor.fetchall()
    conn.close()

    doc1_tests = {o["test_name"]: dict(o) for o in obs if o["document_id"] == doc_id_1}
    doc2_tests = {o["test_name"]: dict(o) for o in obs if o["document_id"] == doc_id_2}

    common_tests = []
    for name in set(doc1_tests.keys()).union(set(doc2_tests.keys())):
        t1 = doc1_tests.get(name)
        t2 = doc2_tests.get(name)
        
        delta = None
        pct_change = None
        if t1 and t2 and t1["value"] is not None and t2["value"] is not None:
            delta = round(t2["value"] - t1["value"], 2)
            pct_change = round((delta / t1["value"]) * 100, 1) if t1["value"] != 0 else 0

        common_tests.append({
            "test_name": name,
            "unit": t1.get("unit") if t1 else t2.get("unit"),
            "report_1": t1,
            "report_2": t2,
            "delta": delta,
            "percent_change": pct_change,
            "improved": (delta < 0) if t1 and t1.get("flag") == "high" else (delta > 0) if t1 and t1.get("flag") == "low" else None
        })

    return {
        "document_1": docs.get(doc_id_1),
        "document_2": docs.get(doc_id_2),
        "comparisons": common_tests
    }

@router.get("/vitals")
def get_vitals(patient_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM health_measurements
        WHERE patient_id = ?
        ORDER BY measured_at ASC
    """, (patient_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("/vitals")
def log_vital(data: VitalMeasurementCreate):
    conn = get_db()
    cursor = conn.cursor()
    v_id = f"vit_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO health_measurements (id, patient_id, measurement_type, value, value_secondary, unit, measured_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (v_id, data.patient_id, data.measurement_type, data.value, data.value_secondary, data.unit, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    return {"id": v_id, "status": "logged"}
