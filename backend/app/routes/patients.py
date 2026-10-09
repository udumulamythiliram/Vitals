import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit

router = APIRouter(prefix="/api/patients", tags=["patients"])

class PatientCreate(BaseModel):
    full_name: str
    relationship: str # self | parent | child | dependent
    date_of_birth: Optional[str] = None
    age_group: Optional[str] = "adult" # infant | child | adult | elderly
    gender: Optional[str] = "Other"
    blood_group: Optional[str] = "Unknown"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[str] = "None"
    chronic_conditions: Optional[str] = "None"

class CaregiverInvite(BaseModel):
    caregiver_name: str
    caregiver_email: str
    permissions: List[str] # ["view_records", "view_medications", "manage_appointments"]

@router.get("")
def list_patients():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, full_name, relationship, date_of_birth, age_group,
               gender, blood_group, emergency_contact_name, emergency_contact_phone,
               allergies, chronic_conditions, is_active, created_at
        FROM patient_profiles
        WHERE user_id = 'user_judge_default'
        ORDER BY is_active DESC, created_at ASC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("")
def create_patient(data: PatientCreate):
    conn = get_db()
    cursor = conn.cursor()
    new_id = f"p_{uuid.uuid4().hex[:8]}"
    
    # Check if this is the first patient, make active if so
    cursor.execute("SELECT COUNT(*) as count FROM patient_profiles WHERE user_id = 'user_judge_default'")
    cnt = cursor.fetchone()["count"]
    is_active = 1 if cnt == 0 else 0

    cursor.execute("""
        INSERT INTO patient_profiles (id, user_id, full_name, relationship, date_of_birth, age_group, gender, blood_group, emergency_contact_name, emergency_contact_phone, allergies, chronic_conditions, is_active, created_at)
        VALUES (?, 'user_judge_default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, data.full_name, data.relationship, data.date_of_birth, data.age_group, data.gender, data.blood_group, data.emergency_contact_name, data.emergency_contact_phone, data.allergies, data.chronic_conditions, is_active, datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()
    log_audit("CREATE_PATIENT", "patient_profiles", new_id, "user_judge_default")
    return {"id": new_id, "status": "created"}

@router.post("/{patient_id}/activate")
def activate_patient(patient_id: str):
    conn = get_db()
    cursor = conn.cursor()
    # Check patient exists
    cursor.execute("SELECT id, full_name FROM patient_profiles WHERE id = ? AND user_id = 'user_judge_default'", (patient_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient profile not found")

    cursor.execute("UPDATE patient_profiles SET is_active = 0 WHERE user_id = 'user_judge_default'")
    cursor.execute("UPDATE patient_profiles SET is_active = 1 WHERE id = ?", (patient_id,))
    conn.commit()
    conn.close()
    log_audit("SWITCH_ACTIVE_PATIENT", "patient_profiles", patient_id, "user_judge_default")
    return {"status": "success", "active_patient_id": patient_id, "full_name": target["full_name"]}

@router.get("/{patient_id}/caregivers")
def get_caregivers(patient_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM caregiver_relationships WHERE patient_id = ?", (patient_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("/{patient_id}/caregivers")
def invite_caregiver(patient_id: str, data: CaregiverInvite):
    import json
    conn = get_db()
    cursor = conn.cursor()
    c_id = f"cg_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO caregiver_relationships (id, patient_id, caregiver_email, caregiver_name, permissions, consent_granted, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
    """, (c_id, patient_id, data.caregiver_email, data.caregiver_name, json.dumps(data.permissions), datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    log_audit("INVITE_CAREGIVER", "caregiver_relationships", c_id, "user_judge_default")
    return {"id": c_id, "status": "invited"}
