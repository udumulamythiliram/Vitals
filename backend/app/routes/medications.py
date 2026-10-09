import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit

router = APIRouter(prefix="/api/medications", tags=["medications"])

class MedicationCreate(BaseModel):
    patient_id: str
    drug_name: str
    dosage: str
    frequency: str
    duration: Optional[str] = "30 days"
    instructions: Optional[str] = "As directed"
    status: Optional[str] = "active" # active | historical | uncertain

class AdherenceLog(BaseModel):
    medication_id: str
    status: str # taken | skipped | missed
    notes: Optional[str] = None

class ReminderCreate(BaseModel):
    patient_id: str
    title: str
    reminder_time: str
    repeat_pattern: Optional[str] = "daily"

@router.get("")
def list_medications(patient_id: str, status: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if status:
        cursor.execute("""
            SELECT m.*, d.original_filename as source_doc_name
            FROM medications m
            LEFT JOIN documents d ON m.document_id = d.id
            WHERE m.patient_id = ? AND m.status = ?
            ORDER BY m.created_at DESC
        """, (patient_id, status))
    else:
        cursor.execute("""
            SELECT m.*, d.original_filename as source_doc_name
            FROM medications m
            LEFT JOIN documents d ON m.document_id = d.id
            WHERE m.patient_id = ?
            ORDER BY m.created_at DESC
        """, (patient_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("")
def add_medication(data: MedicationCreate):
    conn = get_db()
    cursor = conn.cursor()
    m_id = f"med_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO medications (id, patient_id, drug_name, dosage, frequency, duration, instructions, status, user_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, (m_id, data.patient_id, data.drug_name, data.dosage, data.frequency, data.duration, data.instructions, data.status, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    log_audit("ADD_MEDICATION", "medications", m_id, "user_judge_default")
    return {"id": m_id, "status": "created"}

@router.put("/{medication_id}/status")
def update_medication_status(medication_id: str, status: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE medications SET status = ? WHERE id = ?", (status, medication_id))
    conn.commit()
    conn.close()
    log_audit("UPDATE_MED_STATUS", "medications", medication_id, "user_judge_default")
    return {"status": "success", "new_status": status}

@router.post("/adherence")
def log_adherence(data: AdherenceLog):
    conn = get_db()
    cursor = conn.cursor()
    evt_id = f"evt_adh_{uuid.uuid4().hex[:8]}"
    
    # Get patient_id
    cursor.execute("SELECT patient_id FROM medications WHERE id = ?", (data.medication_id,))
    med = cursor.fetchone()
    if not med:
        conn.close()
        raise HTTPException(status_code=404, detail="Medication not found")

    cursor.execute("""
        INSERT INTO medication_events (id, medication_id, patient_id, scheduled_time, taken_time, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (evt_id, data.medication_id, med["patient_id"], datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), data.status, data.notes))
    conn.commit()
    conn.close()
    return {"id": evt_id, "status": "logged"}

@router.get("/reminders")
def get_reminders(patient_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reminders WHERE patient_id = ? ORDER BY reminder_time ASC", (patient_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("/reminders")
def create_reminder(data: ReminderCreate):
    conn = get_db()
    cursor = conn.cursor()
    r_id = f"rem_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO reminders (id, patient_id, title, reminder_time, repeat_pattern, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    """, (r_id, data.patient_id, data.title, data.reminder_time, data.repeat_pattern))
    conn.commit()
    conn.close()
    return {"id": r_id, "status": "created"}
