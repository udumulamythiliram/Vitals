import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.db import get_db, log_audit
from app.llm.gateway import llm_gateway
from app.pipeline.reference_engine import evaluate_lab_value

router = APIRouter(prefix="/api/summaries", tags=["summaries"])

@router.get("/{document_id}")
async def get_document_summary(
    document_id: str,
    language: str = Query("en", description="en | te | hi"),
    reading_level: str = Query("standard", description="simple | standard | detailed")
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.id, d.patient_id, d.original_filename, d.document_type, d.created_at,
               p.full_name as patient_name, p.age_group
        FROM documents d
        JOIN patient_profiles p ON d.patient_id = p.id
        WHERE d.id = ?
    """, (document_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    # Check cache in ai_summaries table
    cursor.execute("""
        SELECT summary_text, key_findings_json, model_used, cached_at
        FROM ai_summaries
        WHERE document_id = ? AND language = ? AND reading_level = ?
    """, (document_id, language, reading_level))
    cached = cursor.fetchone()
    if cached:
        conn.close()
        return {
            "summary_text": cached["summary_text"],
            "key_findings": json.loads(cached["key_findings_json"]) if cached["key_findings_json"] else {},
            "model_used": cached["model_used"],
            "cached": True,
            "language": language,
            "reading_level": reading_level
        }

    # Fetch extracted fields & observations for this document
    cursor.execute("SELECT test_name, value, unit, reference_range, flag FROM observations WHERE document_id = ?", (document_id,))
    obs = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT drug_name, dosage, frequency, instructions FROM medications WHERE document_id = ?", (document_id,))
    meds = [dict(r) for r in cursor.fetchall()]

    # Also check extracted_fields if not yet verified
    cursor.execute("SELECT field_name, original_text, extracted_value FROM extracted_fields WHERE document_id = ?", (document_id,))
    raw_fields = [dict(r) for r in cursor.fetchall()]

    record_context = {
        "document_name": doc["original_filename"],
        "document_type": doc["document_type"],
        "patient": doc["patient_name"],
        "age_group": doc["age_group"],
        "lab_observations": obs,
        "medications": meds,
        "extracted_fields": raw_fields[:10]
    }

    # Prompt LLM Gateway
    prompt_content = f"""Generate a structured health summary.
DOCUMENT TYPE: {doc['document_type']}
LANGUAGE: {language}
READING LEVEL: {reading_level}
AGE GROUP: {doc['age_group']}

RECORD DATA:
{json.dumps(record_context, indent=2)}
"""

    llm_resp = await llm_gateway.complete(
        messages=[
            {"role": "system", "content": "You are Vitalis AI, an empathetic health summarizer. Use ONLY provided records. Never diagnose or change doses."},
            {"role": "user", "content": prompt_content}
        ],
        temperature=0.2,
        prompt_version="summarize.v1"
    )

    summary_text = llm_resp.get("content", "")

    # Regional language Telugu / Hindi support enhancements
    if language == "te" and "తెలుగు" not in summary_text:
        summary_text = f"### డాక్యుమెంట్ సారాంశం ({doc['original_filename']})\n\n" + \
            "మీరు అప్‌లోడ్ చేసిన రికార్డుల ప్రకారం:\n" + \
            ("- **మందులు (Medications):** " + ", ".join([f"{m.get('drug_name', '')} {m.get('dosage', '')}" for m in meds]) if meds else "") + \
            ("\n- **ప్రయోగశాల ఫలితాలు (Lab Results):** " + ", ".join([f"{o.get('test_name', '')}: {o.get('value', '')} {o.get('unit', '')}" for o in obs]) if obs else "") + \
            "\n\n### గమనిక\nఏవైనా సందేహాలు ఉంటే మీ వైద్యుడిని సంప్రదించండి. మోతాదులను మీరే మార్చవద్దు."

    elif language == "hi" and "हिन्दी" not in summary_text and "दवाइयाँ" not in summary_text:
        summary_text = f"### स्वास्थ्य दस्तावेज़ सारांश ({doc['original_filename']})\n\n" + \
            "आपके रिकॉर्ड के मुख्य बिंदु:\n" + \
            ("- **दवाइयाँ (Medications):** " + ", ".join([f"{m.get('drug_name', '')} {m.get('dosage', '')}" for m in meds]) if meds else "") + \
            ("\n- **लैब परिणाम (Lab Results):** " + ", ".join([f"{o.get('test_name', '')}: {o.get('value', '')} {o.get('unit', '')}" for o in obs]) if obs else "") + \
            "\n\n### महत्वपूर्ण सलाह\nकोई भी दवा बदलने से पहले अपने डॉक्टर से सलाह लें।"

    # Cache summary in database
    s_id = f"sum_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO ai_summaries (id, document_id, patient_id, language, reading_level, summary_text, key_findings_json, template_version, model_used, cached_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'summarize.v1', ?, ?)
    """, (s_id, document_id, doc["patient_id"], language, reading_level, summary_text, json.dumps(record_context), llm_resp.get("model_used", "vitalis-engine"), datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()

    log_audit("GET_SUMMARY", "documents", document_id, "user_judge_default")

    return {
        "summary_text": summary_text,
        "key_findings": record_context,
        "model_used": llm_resp.get("model_used"),
        "cached": False,
        "language": language,
        "reading_level": reading_level,
        "is_fallback": llm_resp.get("is_fallback", False)
    }

@router.get("/{document_id}/explain-abnormal")
async def explain_abnormal(document_id: str):
    """
    Deterministically computes abnormal flags and returns safe educational explanations.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT test_name, value, unit, reference_range, flag FROM observations WHERE document_id = ?", (document_id,))
    obs = [dict(r) for r in cursor.fetchall()]
    conn.close()

    abnormal_items = [o for o in obs if o["flag"] in ["high", "low", "abnormal", "critical_high", "critical_low"]]

    if not abnormal_items:
        return {
            "has_abnormal": False,
            "message": "All diagnostic test values recorded in this report are within the printed reference ranges.",
            "items": []
        }

    prompt = f"Explain what these lab tests measure in general educational terms without diagnosing the patient:\n{json.dumps(abnormal_items, indent=2)}"
    
    llm_resp = await llm_gateway.complete(
        messages=[
            {"role": "system", "content": "You are Vitalis Copilot. Explain lab tests objectively. Never diagnose diseases."},
            {"role": "user", "content": prompt}
        ],
        prompt_version="explain_abnormal.v1"
    )

    return {
        "has_abnormal": True,
        "items": abnormal_items,
        "explanation": llm_resp.get("content", ""),
        "model_used": llm_resp.get("model_used")
    }
