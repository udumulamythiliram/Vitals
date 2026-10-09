from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from app.db import get_db

router = APIRouter(prefix="/api/timeline", tags=["timeline"])

@router.get("")
def get_patient_timeline(patient_id: str):
    conn = get_db()
    cursor = conn.cursor()

    events: List[Dict[str, Any]] = []

    # 1. Documents uploaded
    cursor.execute("""
        SELECT id, original_filename, document_type, status, created_at
        FROM documents
        WHERE patient_id = ?
    """, (patient_id,))
    for d in cursor.fetchall():
        events.append({
            "id": f"evt_doc_{d['id']}",
            "type": "document_upload",
            "title": f"Document Added: {d['original_filename']}",
            "subtitle": f"Category: {d['document_type'].replace('_', ' ').title()}",
            "date": d["created_at"],
            "status": d["status"],
            "source_id": d["id"]
        })

    # 2. Lab observations
    cursor.execute("""
        SELECT o.id, o.test_name, o.value, o.unit, o.reference_range, o.flag, o.collection_date, o.lab_name, o.document_id,
               d.original_filename as doc_name
        FROM observations o
        LEFT JOIN documents d ON o.document_id = d.id
        WHERE o.patient_id = ?
    """, (patient_id,))
    for o in cursor.fetchall():
        flag_label = f" ({o['flag'].upper()})" if o["flag"] in ["high", "low", "critical_high", "critical_low"] else ""
        events.append({
            "id": f"evt_obs_{o['id']}",
            "type": "lab_test",
            "title": f"{o['test_name']}: {o['value']} {o['unit']}{flag_label}",
            "subtitle": f"Ref: {o['reference_range'] or 'Standard'} | {o['lab_name'] or 'Lab'}",
            "date": o["collection_date"] or o["id"],
            "flag": o["flag"],
            "source_id": o["document_id"],
            "doc_name": o["doc_name"]
        })

    # 3. Medications prescribed
    cursor.execute("""
        SELECT m.id, m.drug_name, m.dosage, m.frequency, m.instructions, m.created_at, m.document_id,
               d.original_filename as doc_name
        FROM medications m
        LEFT JOIN documents d ON m.document_id = d.id
        WHERE m.patient_id = ?
    """, (patient_id,))
    for m in cursor.fetchall():
        events.append({
            "id": f"evt_med_{m['id']}",
            "type": "medication",
            "title": f"Prescribed {m['drug_name']} {m['dosage']}",
            "subtitle": f"Frequency: {m['frequency']} - {m['instructions']}",
            "date": m["created_at"],
            "status": "active",
            "source_id": m["document_id"],
            "doc_name": m["doc_name"]
        })

    # 4. Vaccinations
    cursor.execute("""
        SELECT id, vaccine_name, dose_number, administered_date, provider_name
        FROM vaccinations
        WHERE patient_id = ?
    """, (patient_id,))
    for v in cursor.fetchall():
        events.append({
            "id": f"evt_vax_{v['id']}",
            "type": "vaccination",
            "title": f"Immunization: {v['vaccine_name']} (Dose {v['dose_number']})",
            "subtitle": f"Administered at {v['provider_name']}",
            "date": v["administered_date"],
            "status": "completed"
        })

    # 5. Appointments
    cursor.execute("""
        SELECT id, clinician_name, facility, appointment_time, notes, status
        FROM appointments
        WHERE patient_id = ?
    """, (patient_id,))
    for a in cursor.fetchall():
        events.append({
            "id": f"evt_apt_{a['id']}",
            "type": "appointment",
            "title": f"Appointment with {a['clinician_name']}",
            "subtitle": f"{a['facility']} - {a['notes']}",
            "date": a["appointment_time"],
            "status": a["status"]
        })

    conn.close()

    # Sort descending by date
    events.sort(key=lambda x: str(x.get("date", "")), reverse=True)
    return events
