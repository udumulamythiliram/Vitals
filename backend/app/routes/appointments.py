import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit
from app.llm.gateway import llm_gateway

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

class AppointmentCreate(BaseModel):
    patient_id: str
    clinician_name: str
    facility: str
    appointment_time: str
    notes: Optional[str] = None

@router.get("")
def list_appointments(patient_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM appointments
        WHERE patient_id = ?
        ORDER BY appointment_time ASC
    """, (patient_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("")
def create_appointment(data: AppointmentCreate):
    conn = get_db()
    cursor = conn.cursor()
    apt_id = f"apt_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO appointments (id, patient_id, clinician_name, facility, appointment_time, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, 'upcoming')
    """, (apt_id, data.patient_id, data.clinician_name, data.facility, data.appointment_time, data.notes))
    conn.commit()
    conn.close()
    log_audit("CREATE_APPOINTMENT", "appointments", apt_id, "user_judge_default")
    return {"id": apt_id, "status": "created"}

@router.post("/{appointment_id}/prep-sheet")
async def generate_prep_sheet(appointment_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,))
    apt = cursor.fetchone()
    if not apt:
        conn.close()
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient_id = apt["patient_id"]
    cursor.execute("SELECT full_name, age_group, chronic_conditions, allergies FROM patient_profiles WHERE id = ?", (patient_id,))
    patient = cursor.fetchone()

    # Active medications
    cursor.execute("SELECT drug_name, dosage, frequency, instructions FROM medications WHERE patient_id = ? AND status = 'active'", (patient_id,))
    meds = [dict(r) for r in cursor.fetchall()]

    # Abnormal observations
    cursor.execute("SELECT test_name, value, unit, reference_range, flag, collection_date FROM observations WHERE patient_id = ? AND flag IN ('high', 'low', 'abnormal') ORDER BY collection_date DESC LIMIT 5", (patient_id,))
    abnormal_obs = [dict(r) for r in cursor.fetchall()]

    prep_data = {
        "patient": dict(patient) if patient else {},
        "appointment": dict(apt),
        "active_medications": meds,
        "abnormal_findings": abnormal_obs,
        "questions_for_doctor": [
            f"Are my current medications ({', '.join([m['drug_name'] for m in meds[:2]])}) working effectively?",
            "Are there any specific dietary or physical activity recommendations based on my recent lab values?",
            "When should I repeat my routine lab work?"
        ]
    }

    # Save to appointment record
    cursor.execute("UPDATE appointments SET prep_sheet_json = ? WHERE id = ?", (json.dumps(prep_data), appointment_id))
    conn.commit()
    conn.close()

    log_audit("GENERATE_PREP_SHEET", "appointments", appointment_id, "user_judge_default")

    return {
        "appointment_id": appointment_id,
        "prep_sheet": prep_data
    }
