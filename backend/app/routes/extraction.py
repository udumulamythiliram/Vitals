import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit
from app.llm.gateway import llm_gateway
from app.llm.sanitizer import PIISanitizer, defend_prompt_injection
from app.pipeline.reference_engine import evaluate_lab_value
from app.pipeline.normalizer import match_medication_name, normalize_frequency, parse_iso_date

router = APIRouter(prefix="/api/extraction", tags=["extraction"])

class FieldUpdateRequest(BaseModel):
    user_corrected_value: str
    status: Optional[str] = "confident"

@router.post("/{document_id}/run")
async def run_extraction(document_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, patient_id, document_type, original_filename FROM documents WHERE id = ?", (document_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    # Get page text
    cursor.execute("SELECT raw_text FROM document_pages WHERE document_id = ? ORDER BY page_number ASC", (document_id,))
    pages = cursor.fetchall()
    full_text = "\n".join([p["raw_text"] or "" for p in pages]).strip()

    if not full_text:
        conn.close()
        return {
            "status": "warning",
            "message": "No machine text extracted. Please upload a clearer image or use manual entry.",
            "fields": []
        }

    # Defend against prompt injections
    clean_text = defend_prompt_injection(full_text)
    # Sanitize PII
    sanitized_text, pii_map = PIISanitizer.sanitize(clean_text)

    # Clear old extracted fields for fresh run
    cursor.execute("DELETE FROM extracted_fields WHERE document_id = ?", (document_id,))
    
    # Prompt execution via LLM Gateway
    system_prompt = "You are a clinical informatics data extraction engine. Output valid JSON matching schema."
    user_prompt = f"Extract structured data from this medical document:\n```\n{sanitized_text}\n```"

    llm_resp = await llm_gateway.complete(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        schema={"type": "object"},
        temperature=0.0
    )

    content_str = llm_resp.get("content", "{}")
    # Repair JSON if markdown wrapped
    if "```json" in content_str:
        content_str = content_str.split("```json")[1].split("```")[0].strip()
    elif "```" in content_str:
        content_str = content_str.split("```")[1].split("```")[0].strip()

    extracted_data = {}
    try:
        extracted_data = json.loads(content_str)
    except Exception:
        # Fallback parsing
        extracted_data = {"raw_notes": content_str}

    # Desanitize extracted data before saving
    saved_fields = []
    
    # Parse lab tests if present
    if "tests" in extracted_data and isinstance(extracted_data["tests"], list):
        for t in extracted_data["tests"]:
            t_name = PIISanitizer.desanitize(str(t.get("test_name", "Test")), pii_map)
            val = t.get("value")
            val_num = float(val) if val is not None and str(val).replace(".", "").isdigit() else 0.0
            unit = str(t.get("unit", ""))
            ref_range = str(t.get("reference_range", ""))
            
            # Deterministic reference evaluation
            eval_res = evaluate_lab_value(t_name, val_num, ref_range)
            field_id = f"f_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO extracted_fields (id, document_id, field_name, original_text, extracted_value, confidence, status, source_page)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (field_id, document_id, t_name, f"{val} {unit} (Ref: {ref_range})", json.dumps({
                "value": val_num, "unit": unit, "reference_range": ref_range, "flag": eval_res["flag"], "is_abnormal": eval_res["is_abnormal"]
            }), t.get("confidence", 0.95), t.get("status", "confident")))
            saved_fields.append({"id": field_id, "name": t_name, "value": f"{val_num} {unit}", "flag": eval_res["flag"]})

    # Parse medications if present
    if "medications" in extracted_data and isinstance(extracted_data["medications"], list):
        for m in extracted_data["medications"]:
            drug_raw = m.get("drug_name", {})
            drug_name = drug_raw.get("value") if isinstance(drug_raw, dict) else str(drug_raw)
            drug_match = match_medication_name(drug_name)
            
            dose = m.get("dosage", {}).get("value") if isinstance(m.get("dosage"), dict) else str(m.get("dosage", ""))
            freq = normalize_frequency(m.get("frequency", {}).get("value") if isinstance(m.get("frequency"), dict) else str(m.get("frequency", "")))
            
            field_id = f"f_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO extracted_fields (id, document_id, field_name, original_text, extracted_value, confidence, status, source_page)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (field_id, document_id, f"Medication: {drug_match['canonical_name']}", f"{drug_name} {dose} {freq}", json.dumps({
                "drug_name": drug_match["canonical_name"], "dosage": dose, "frequency": freq, "is_known_drug": drug_match["is_known"]
            }), drug_match["confidence"], "confident" if drug_match["is_known"] else "needs_review"))
            saved_fields.append({"id": field_id, "name": drug_match["canonical_name"], "dosage": dose, "frequency": freq})

    # Record extraction run
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO extraction_runs (id, document_id, run_at, model_used, confidence_score, status)
        VALUES (?, ?, ?, ?, 0.95, 'completed')
    """, (run_id, document_id, datetime.utcnow().isoformat(), llm_resp.get("model_used", "vitalis-deterministic-v1")))

    cursor.execute("UPDATE documents SET status = 'extracted' WHERE id = ?", (document_id,))
    conn.commit()
    conn.close()

    log_audit("RUN_EXTRACTION", "documents", document_id, "user_judge_default")

    return {
        "status": "success",
        "document_id": document_id,
        "fields_extracted": len(saved_fields),
        "fields": saved_fields,
        "model_used": llm_resp.get("model_used"),
        "is_fallback": llm_resp.get("is_fallback", False)
    }

@router.get("/{document_id}/fields")
def get_extracted_fields(document_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, document_id, field_name, original_text, extracted_value, confidence, status, source_page, user_corrected_value, corrected_at
        FROM extracted_fields
        WHERE document_id = ?
        ORDER BY status DESC, field_name ASC
    """, (document_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.put("/fields/{field_id}")
def update_field(field_id: str, data: FieldUpdateRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE extracted_fields
        SET user_corrected_value = ?, status = ?, corrected_at = ?
        WHERE id = ?
    """, (data.user_corrected_value, data.status, datetime.utcnow().isoformat(), field_id))
    conn.commit()
    conn.close()
    log_audit("UPDATE_FIELD", "extracted_fields", field_id, "user_judge_default")
    return {"status": "success", "field_id": field_id}

@router.post("/{document_id}/verify")
def verify_and_commit(document_id: str):
    """
    Commit reviewed fields into permanent observations & medications records.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT patient_id FROM documents WHERE id = ?", (document_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
        
    patient_id = doc["patient_id"]

    cursor.execute("SELECT * FROM extracted_fields WHERE document_id = ?", (document_id,))
    fields = cursor.fetchall()

    for f in fields:
        raw_val = f["user_corrected_value"] or f["extracted_value"]
        try:
            val_dict = json.loads(raw_val)
        except Exception:
            val_dict = {}

        # If medication
        if "drug_name" in val_dict:
            m_id = f"med_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO medications (id, patient_id, document_id, drug_name, dosage, frequency, duration, instructions, status, user_verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)
            """, (m_id, patient_id, document_id, val_dict["drug_name"], val_dict.get("dosage", ""), val_dict.get("frequency", ""), "30 days", "As instructed", datetime.utcnow().isoformat()))

        # If lab observation
        elif "value" in val_dict and "unit" in val_dict:
            obs_id = f"obs_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO observations (id, patient_id, document_id, test_name, value, value_text, unit, reference_range, flag, collection_date, report_date, lab_name, user_verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (obs_id, patient_id, document_id, f["field_name"], val_dict["value"], str(val_dict["value"]), val_dict["unit"], val_dict.get("reference_range", ""), val_dict.get("flag", "normal"), datetime.utcnow().strftime("%Y-%m-%d"), datetime.utcnow().strftime("%Y-%m-%d"), "Laboratory", datetime.utcnow().isoformat()))

    cursor.execute("UPDATE documents SET status = 'reviewed' WHERE id = ?", (document_id,))
    conn.commit()
    conn.close()

    log_audit("VERIFY_DOCUMENT", "documents", document_id, "user_judge_default")
    return {"status": "success", "message": "Records verified and committed to profile"}
