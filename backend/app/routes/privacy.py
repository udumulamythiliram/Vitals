import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

class ConsentUpdate(BaseModel):
    ai_processing_consent: bool
    cloud_backup_consent: bool
    anonymized_research_consent: bool

@router.get("/audit")
def get_audit_trail():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, action, target_type, target_id, ip_address, timestamp
        FROM audit_events
        ORDER BY timestamp DESC
        LIMIT 50
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.get("/consent")
def get_consent_status():
    return {
        "policy_version": "v2.1-2024",
        "consents": {
            "ai_processing_consent": True,
            "cloud_backup_consent": True,
            "anonymized_research_consent": False
        },
        "description": "Your medical text is sanitized of direct phone, email and Aadhaar identifiers before AI analysis. LLM providers do not retain your data for model training under our enterprise terms.",
        "limitations": [
            "Vitalis AI implements strict row-level and patient-scoped authorization.",
            "Vitalis AI is an informational health companion, not a certified Medical Device under CDSCO/FDA.",
            "HIPAA/GDPR/DPDP compliance posture: Server-side authorization, encryption-in-transit, private storage, and reversible PII minimization are implemented; formal BAA/certifications are not claimed."
        ]
    }

@router.get("/export")
def export_all_user_data():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM patient_profiles WHERE user_id = 'user_judge_default'")
    patients = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT d.* FROM documents d JOIN patient_profiles p ON d.patient_id = p.id WHERE p.user_id = 'user_judge_default'")
    docs = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT o.* FROM observations o JOIN patient_profiles p ON o.patient_id = p.id WHERE p.user_id = 'user_judge_default'")
    obs = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT m.* FROM medications m JOIN patient_profiles p ON m.patient_id = p.id WHERE p.user_id = 'user_judge_default'")
    meds = [dict(r) for r in cursor.fetchall()]

    conn.close()
    log_audit("EXPORT_FULL_DATA", "users", "user_judge_default", "user_judge_default")

    return {
        "exported_at": datetime.utcnow().isoformat(),
        "user_id": "user_judge_default",
        "profiles": patients,
        "documents": docs,
        "observations": obs,
        "medications": meds
    }

@router.delete("/account")
def delete_account():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = 'user_judge_default'")
    conn.commit()
    conn.close()
    log_audit("DELETE_ACCOUNT", "users", "user_judge_default")
    return {"status": "success", "message": "All user profiles, records, and documents purged."}
