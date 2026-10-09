from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.db import get_db, log_audit

router = APIRouter(prefix="/api/auth", tags=["auth"])

class PreferenceUpdate(BaseModel):
    language: Optional[str] = "en"
    reading_level: Optional[str] = "standard"
    accessibility_mode: Optional[str] = "none"
    reminder_style: Optional[str] = "standard"
    ai_consent: Optional[int] = 1

@router.post("/demo-login")
def demo_login():
    """Instant 1-click judge demo login without barriers"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role FROM users WHERE id = 'user_judge_default'")
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Demo user not found. Please run seed.")
    
    cursor.execute("SELECT language, reading_level, accessibility_mode, reminder_style, ai_consent FROM user_preferences WHERE user_id = ?", (user["id"],))
    pref = cursor.fetchone()
    
    # Get active patient
    cursor.execute("SELECT id, full_name, relationship, age_group FROM patient_profiles WHERE user_id = ? AND is_active = 1", (user["id"],))
    active_patient = cursor.fetchone()
    
    conn.close()
    log_audit("DEMO_LOGIN", "users", user["id"], user["id"])
    
    return {
        "user": dict(user),
        "preferences": dict(pref) if pref else {},
        "active_patient": dict(active_patient) if active_patient else None,
        "token": "demo_session_token_valid"
    }

@router.get("/me")
def get_current_user():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role FROM users WHERE id = 'user_judge_default'")
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    cursor.execute("SELECT language, reading_level, accessibility_mode, reminder_style, ai_consent FROM user_preferences WHERE user_id = ?", (user["id"],))
    pref = cursor.fetchone()
    conn.close()
    return {
        "user": dict(user),
        "preferences": dict(pref) if pref else {}
    }

@router.put("/preferences")
def update_preferences(data: PreferenceUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_preferences (user_id, language, reading_level, accessibility_mode, reminder_style, ai_consent)
        VALUES ('user_judge_default', ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            language = excluded.language,
            reading_level = excluded.reading_level,
            accessibility_mode = excluded.accessibility_mode,
            reminder_style = excluded.reminder_style,
            ai_consent = excluded.ai_consent
    """, (data.language, data.reading_level, data.accessibility_mode, data.reminder_style, data.ai_consent))
    conn.commit()
    conn.close()
    return {"status": "success", "preferences": data.model_dump()}
