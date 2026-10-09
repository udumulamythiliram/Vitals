import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings

def get_db():
    conn = sqlite3.connect(str(settings.DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    -- Users and Preferences
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'patient',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        language TEXT DEFAULT 'en',
        reading_level TEXT DEFAULT 'standard',
        accessibility_mode TEXT DEFAULT 'none',
        reminder_style TEXT DEFAULT 'standard',
        ai_consent INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS theme_settings (
        user_id TEXT PRIMARY KEY,
        theme_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Patient Profiles & Family
    CREATE TABLE IF NOT EXISTS patient_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        relationship TEXT NOT NULL, -- self | parent | child | dependent
        date_of_birth TEXT,
        age_group TEXT, -- infant | child | adult | elderly
        gender TEXT,
        blood_group TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        allergies TEXT,
        chronic_conditions TEXT,
        is_active INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS caregiver_relationships (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        caregiver_email TEXT NOT NULL,
        caregiver_name TEXT NOT NULL,
        permissions TEXT NOT NULL, -- JSON array of strings
        consent_granted INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS consent_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        patient_id TEXT,
        consent_type TEXT NOT NULL,
        granted INTEGER NOT NULL,
        granted_at TEXT NOT NULL,
        version TEXT NOT NULL,
        policy_text TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Documents and Pipeline
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        document_type TEXT DEFAULT 'general', -- prescription | lab_report | discharge_summary | general
        status TEXT DEFAULT 'uploaded', -- uploaded | processing | extracted | reviewed | failed
        processing_error TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_pages (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        raw_text TEXT,
        image_path TEXT,
        ocr_confidence REAL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ocr_results (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        engine TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        text_length INTEGER NOT NULL,
        raw_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extraction_runs (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        run_at TEXT NOT NULL,
        model_used TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extracted_fields (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        original_text TEXT,
        extracted_value TEXT,
        confidence REAL DEFAULT 0.9,
        status TEXT DEFAULT 'confident', -- confident | needs_review | unreadable
        source_page INTEGER DEFAULT 1,
        user_corrected_value TEXT,
        corrected_at TEXT,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    -- Structured Health Entities
    CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        document_id TEXT,
        test_name TEXT NOT NULL,
        value REAL,
        value_text TEXT,
        unit TEXT,
        reference_range TEXT,
        flag TEXT, -- normal | high | low | abnormal | critical
        collection_date TEXT,
        report_date TEXT,
        lab_name TEXT,
        user_verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        document_id TEXT,
        drug_name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        duration TEXT,
        instructions TEXT,
        status TEXT DEFAULT 'active', -- active | historical | uncertain
        user_verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS medication_events (
        id TEXT PRIMARY KEY,
        medication_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        taken_time TEXT,
        status TEXT DEFAULT 'pending', -- pending | taken | skipped | missed
        notes TEXT,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conditions (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        document_id TEXT,
        condition_name TEXT NOT NULL,
        recorded_date TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS allergies (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        allergen TEXT NOT NULL,
        severity TEXT,
        reaction TEXT,
        recorded_date TEXT,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS encounters (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        encounter_date TEXT NOT NULL,
        reason TEXT,
        summary TEXT,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        clinician_name TEXT NOT NULL,
        facility TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        notes TEXT,
        prep_sheet_json TEXT,
        status TEXT DEFAULT 'upcoming', -- upcoming | completed | cancelled
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        vaccine_name TEXT NOT NULL,
        dose_number INTEGER DEFAULT 1,
        administered_date TEXT NOT NULL,
        provider_name TEXT,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS health_measurements (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        measurement_type TEXT NOT NULL, -- blood_pressure | glucose | pulse | weight
        value REAL NOT NULL,
        value_secondary REAL, -- e.g. diastolic for BP
        unit TEXT NOT NULL,
        measured_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    -- Chat and Summaries
    CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL, -- user | assistant | system
        content TEXT NOT NULL,
        safety_flag TEXT DEFAULT 'safe',
        template_version TEXT,
        model_used TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS message_sources (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        excerpt TEXT,
        page_number INTEGER,
        FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_summaries (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        reading_level TEXT DEFAULT 'standard',
        summary_text TEXT NOT NULL,
        key_findings_json TEXT,
        template_version TEXT NOT NULL,
        model_used TEXT NOT NULL,
        cached_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        title TEXT NOT NULL,
        reminder_time TEXT NOT NULL,
        repeat_pattern TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fhir_resources (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        fhir_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        ip_address TEXT,
        timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS eval_runs (
        id TEXT PRIMARY KEY,
        run_at TEXT NOT NULL,
        fixture_count INTEGER NOT NULL,
        field_accuracy REAL NOT NULL,
        abnormal_flag_accuracy REAL NOT NULL,
        summary_faithfulness REAL NOT NULL,
        safety_redteam_pass_rate REAL NOT NULL,
        avg_latency_ms REAL NOT NULL,
        model_used TEXT NOT NULL,
        details_json TEXT
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_doc_patient ON documents(patient_id);
    CREATE INDEX IF NOT EXISTS idx_obs_patient ON observations(patient_id);
    CREATE INDEX IF NOT EXISTS idx_meds_patient ON medications(patient_id);
    CREATE INDEX IF NOT EXISTS idx_chat_patient ON chat_conversations(patient_id);
    CREATE INDEX IF NOT EXISTS idx_msg_conv ON chat_messages(conversation_id);
    """)

    conn.commit()
    conn.close()

def log_audit(action: str, target_type: str, target_id: Optional[str] = None, user_id: Optional[str] = None, ip_address: Optional[str] = None):
    try:
        conn = get_db()
        import uuid
        conn.execute(
            "INSERT INTO audit_events (id, user_id, action, target_type, target_id, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), user_id, action, target_type, target_id, ip_address, datetime.utcnow().isoformat())
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Audit log error: {e}")
