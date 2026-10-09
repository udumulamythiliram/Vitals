import uuid
from datetime import datetime, timedelta, timezone
from app.db import get_db

def seed_demo_data():
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing demo data
    cursor.execute("DELETE FROM users WHERE email LIKE '%@vitalis-demo.internal'")
    conn.commit()

    # Create Judge User
    judge_user_id = "user_judge_default"
    cursor.execute("""
        INSERT INTO users (id, email, full_name, role, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (judge_user_id, "judge@vitalis-demo.internal", "Dr. Evaluator / Judge", "judge", datetime.now(timezone.utc).isoformat()))

    # User Preferences
    cursor.execute("""
        INSERT INTO user_preferences (user_id, language, reading_level, accessibility_mode, reminder_style, ai_consent)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (judge_user_id, "en", "standard", "none", "standard", 1))

    # Four Personas
    personas = [
        {
            "id": "p_elderly_ramachandra",
            "name": "Ramachandra Rao",
            "rel": "parent",
            "dob": "1954-04-12",
            "age_group": "elderly",
            "gender": "Male",
            "blood_group": "O+",
            "emergency_name": "Suresh Rao (Son)",
            "emergency_phone": "+91 98480 22334",
            "allergies": "Penicillin (Moderate rash)",
            "chronic_conditions": "Hypertension, Type 2 Diabetes Mellitus",
            "is_active": 1
        },
        {
            "id": "p_child_aarav",
            "name": "Aarav Sharma",
            "rel": "child",
            "dob": "2024-10-05",
            "age_group": "child",
            "gender": "Male",
            "blood_group": "B+",
            "emergency_name": "Priya Sharma (Mother)",
            "emergency_phone": "+91 98765 43210",
            "allergies": "No known drug allergies",
            "chronic_conditions": "None (Routine pediatric tracking)",
            "is_active": 0
        },
        {
            "id": "p_adult_vikram",
            "name": "Vikram Patel",
            "rel": "self",
            "dob": "1981-08-23",
            "age_group": "adult",
            "gender": "Male",
            "blood_group": "A+",
            "emergency_name": "Ananya Patel (Spouse)",
            "emergency_phone": "+91 99887 76655",
            "allergies": "Sulfa drugs",
            "chronic_conditions": "Dyslipidemia, Prediabetes",
            "is_active": 0
        },
        {
            "id": "p_accessible_lakshmi",
            "name": "Lakshmi Devi",
            "rel": "parent",
            "dob": "1958-11-30",
            "age_group": "elderly",
            "gender": "Female",
            "blood_group": "AB+",
            "emergency_name": "Ravi Kumar (Caregiver)",
            "emergency_phone": "+91 94401 11223",
            "allergies": "Aspirin (Gastric irritation)",
            "chronic_conditions": "Osteoarthritis, Mild Cardiac Arrhythmia",
            "is_active": 0
        }
    ]

    for p in personas:
        cursor.execute("""
            INSERT INTO patient_profiles (id, user_id, full_name, relationship, date_of_birth, age_group, gender, blood_group, emergency_contact_name, emergency_contact_phone, allergies, chronic_conditions, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p["id"], judge_user_id, p["name"], p["rel"], p["dob"], p["age_group"], p["gender"], p["blood_group"], p["emergency_name"], p["emergency_phone"], p["allergies"], p["chronic_conditions"], p["is_active"], datetime.now(timezone.utc).isoformat()))

    # Records for Persona 1: Ramachandra Rao (Elderly)
    # Document 1: Prescription
    doc_rx_id = "doc_ram_rx_001"
    cursor.execute("""
        INSERT INTO documents (id, patient_id, original_filename, stored_filename, file_size, mime_type, file_hash, document_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_rx_id, "p_elderly_ramachandra", "Prescription_Dr_Reddy_Hypertension.pdf", "presc_ram_01.pdf", 245000, "application/pdf", "hash_rx_ram_001", "prescription", "reviewed", (datetime.now(timezone.utc) - timedelta(days=12)).isoformat()))

    cursor.execute("""
        INSERT INTO document_pages (id, document_id, page_number, raw_text, ocr_confidence)
        VALUES (?, ?, ?, ?, ?)
    """, ("page_ram_rx_1", doc_rx_id, 1, "APOLLO HOSPITALS HYDERABAD\nDr. K. V. Reddy, MD, DM (Cardiology)\nPatient: Ramachandra Rao, Age: 72 Y / M\nDate: 28/03/2024\nRx:\n1. Tab. Telmisartan 40mg - 1 Tab OD (Morning, after food)\n2. Tab. Metformin 500mg - 1 Tab BD (After meals)\n3. Tab. Atorvastatin 20mg - 1 Tab HS (Bedtime)\nReview after 3 months with FBS and Lipid profile.", 0.96))

    # Medications
    meds_ram = [
        ("med_ram_1", "p_elderly_ramachandra", doc_rx_id, "Telmisartan", "40 mg", "Once daily", "90 days", "Morning after food", "active", 1),
        ("med_ram_2", "p_elderly_ramachandra", doc_rx_id, "Metformin", "500 mg", "Twice daily", "90 days", "After meals with water", "active", 1),
        ("med_ram_3", "p_elderly_ramachandra", doc_rx_id, "Atorvastatin", "20 mg", "Once daily", "90 days", "At bedtime", "active", 1),
    ]
    for m in meds_ram:
        cursor.execute("""
            INSERT INTO medications (id, patient_id, document_id, drug_name, dosage, frequency, duration, instructions, status, user_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], datetime.now(timezone.utc).isoformat()))

    # Document 2: Lab Report (Ramachandra)
    doc_lab_id = "doc_ram_lab_001"
    cursor.execute("""
        INSERT INTO documents (id, patient_id, original_filename, stored_filename, file_size, mime_type, file_hash, document_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_lab_id, "p_elderly_ramachandra", "Apollo_Diagnostics_Comprehensive_Blood.pdf", "lab_ram_01.pdf", 312000, "application/pdf", "hash_lab_ram_001", "lab_report", "reviewed", (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()))

    cursor.execute("""
        INSERT INTO document_pages (id, document_id, page_number, raw_text, ocr_confidence)
        VALUES (?, ?, ?, ?, ?)
    """, ("page_ram_lab_1", doc_lab_id, 1, "APOLLO DIAGNOSTICS LABORATORY REPORT\nPatient: Ramachandra Rao | Age: 72 | Male\nReport Date: 30/03/2024\nTESTS:\n- Fasting Blood Sugar: 138.0 mg/dL (Reference: 70 - 100) [HIGH]\n- HbA1c: 7.4 % (Reference: 4.0 - 5.6) [HIGH]\n- Serum Creatinine: 1.05 mg/dL (Reference: 0.6 - 1.2) [NORMAL]\n- Hemoglobin: 13.2 g/dL (Reference: 13.0 - 17.0) [NORMAL]\n- Total Cholesterol: 188.0 mg/dL (Reference: 125 - 200) [NORMAL]", 0.98))

    # Observations with deterministic flags
    obs_ram = [
        ("obs_r1", "p_elderly_ramachandra", doc_lab_id, "Fasting Blood Sugar", 138.0, "138.0", "mg/dL", "70 - 100", "high", "2024-03-30", "2024-03-30", "Apollo Diagnostics"),
        ("obs_r2", "p_elderly_ramachandra", doc_lab_id, "HbA1c", 7.4, "7.4", "%", "4.0 - 5.6", "high", "2024-03-30", "2024-03-30", "Apollo Diagnostics"),
        ("obs_r3", "p_elderly_ramachandra", doc_lab_id, "Serum Creatinine", 1.05, "1.05", "mg/dL", "0.6 - 1.2", "normal", "2024-03-30", "2024-03-30", "Apollo Diagnostics"),
        ("obs_r4", "p_elderly_ramachandra", doc_lab_id, "Hemoglobin", 13.2, "13.2", "g/dL", "13.0 - 17.0", "normal", "2024-03-30", "2024-03-30", "Apollo Diagnostics"),
        ("obs_r5", "p_elderly_ramachandra", doc_lab_id, "Total Cholesterol", 188.0, "188.0", "mg/dL", "125 - 200", "normal", "2024-03-30", "2024-03-30", "Apollo Diagnostics"),
    ]
    for o in obs_ram:
        cursor.execute("""
            INSERT INTO observations (id, patient_id, document_id, test_name, value, value_text, unit, reference_range, flag, collection_date, report_date, lab_name, user_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (*o, datetime.now(timezone.utc).isoformat()))

    # Records for Persona 2: Aarav Sharma (Child)
    doc_child_id = "doc_aarav_vax_001"
    cursor.execute("""
        INSERT INTO documents (id, patient_id, original_filename, stored_filename, file_size, mime_type, file_hash, document_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_child_id, "p_child_aarav", "Pediatric_Immunization_Aarav.pdf", "vax_aarav.pdf", 180000, "application/pdf", "hash_vax_01", "vaccination_record", "reviewed", (datetime.now(timezone.utc) - timedelta(days=20)).isoformat()))

    cursor.execute("""
        INSERT INTO document_pages (id, document_id, page_number, raw_text, ocr_confidence)
        VALUES (?, ?, ?, ?, ?)
    """, ("page_aarav_1", doc_child_id, 1, "RAINBOW CHILDREN'S HOSPITAL\nChild: Aarav Sharma | DOB: 05/10/2024\nVaccinations Administered:\n1. MMR - Dose 1 (Administered 10/07/2025)\n2. DTP Booster - Dose 1 (Administered 12/04/2025)", 0.99))

    cursor.execute("""
        INSERT INTO vaccinations (id, patient_id, vaccine_name, dose_number, administered_date, provider_name)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("vax_1", "p_child_aarav", "MMR (Measles, Mumps, Rubella)", 1, "2025-07-10", "Rainbow Children's Hospital"))
    cursor.execute("""
        INSERT INTO vaccinations (id, patient_id, vaccine_name, dose_number, administered_date, provider_name)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("vax_2", "p_child_aarav", "DTP Booster", 1, "2025-04-12", "Rainbow Children's Hospital"))

    # Records for Persona 3: Vikram Patel (Comparison between 2 reports)
    doc_vik_1 = "doc_vikram_lab_jun"
    cursor.execute("""
        INSERT INTO documents (id, patient_id, original_filename, stored_filename, file_size, mime_type, file_hash, document_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_vik_1, "p_adult_vikram", "Lipid_Metabolic_Panel_June.pdf", "lab_vik_01.pdf", 210000, "application/pdf", "hash_vik_01", "lab_report", "reviewed", (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()))

    cursor.execute("""
        INSERT INTO document_pages (id, document_id, page_number, raw_text, ocr_confidence)
        VALUES (?, ?, ?, ?, ?)
    """, ("page_vik_1", doc_vik_1, 1, "DR. LAL PATHLABS - METABOLIC PANEL (JANUARY 2024)\nPatient: Vikram Patel | Age: 45\n- Fasting Blood Sugar: 132.0 mg/dL (70 - 100)\n- Total Cholesterol: 242.0 mg/dL (125 - 200)", 0.97))

    cursor.execute("""
        INSERT INTO observations (id, patient_id, document_id, test_name, value, value_text, unit, reference_range, flag, collection_date, report_date, lab_name, user_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, ("obs_v1_fbs", "p_adult_vikram", doc_vik_1, "Fasting Blood Sugar", 132.0, "132.0", "mg/dL", "70 - 100", "high", "2024-01-10", "2024-01-10", "Dr. Lal PathLabs", datetime.now(timezone.utc).isoformat()))
    cursor.execute("""
        INSERT INTO observations (id, patient_id, document_id, test_name, value, value_text, unit, reference_range, flag, collection_date, report_date, lab_name, user_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, ("obs_v1_chol", "p_adult_vikram", doc_vik_1, "Total Cholesterol", 242.0, "242.0", "mg/dL", "125 - 200", "high", "2024-01-10", "2024-01-10", "Dr. Lal PathLabs", datetime.now(timezone.utc).isoformat()))

    # Report 2 (Follow-up)
    doc_vik_2 = "doc_vikram_lab_apr"
    cursor.execute("""
        INSERT INTO documents (id, patient_id, original_filename, stored_filename, file_size, mime_type, file_hash, document_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_vik_2, "p_adult_vikram", "Lipid_Metabolic_Panel_April.pdf", "lab_vik_02.pdf", 225000, "application/pdf", "hash_vik_02", "lab_report", "reviewed", (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()))

    cursor.execute("""
        INSERT INTO document_pages (id, document_id, page_number, raw_text, ocr_confidence)
        VALUES (?, ?, ?, ?, ?)
    """, ("page_vik_2", doc_vik_2, 1, "DR. LAL PATHLABS - FOLLOW-UP (APRIL 2024)\nPatient: Vikram Patel | Age: 45\n- Fasting Blood Sugar: 112.0 mg/dL (70 - 100)\n- Total Cholesterol: 205.0 mg/dL (125 - 200)", 0.98))

    cursor.execute("""
        INSERT INTO observations (id, patient_id, document_id, test_name, value, value_text, unit, reference_range, flag, collection_date, report_date, lab_name, user_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, ("obs_v2_fbs", "p_adult_vikram", doc_vik_2, "Fasting Blood Sugar", 112.0, "112.0", "mg/dL", "70 - 100", "high", "2024-04-12", "2024-04-12", "Dr. Lal PathLabs", datetime.now(timezone.utc).isoformat()))
    cursor.execute("""
        INSERT INTO observations (id, patient_id, document_id, test_name, value, value_text, unit, reference_range, flag, collection_date, report_date, lab_name, user_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, ("obs_v2_chol", "p_adult_vikram", doc_vik_2, "Total Cholesterol", 205.0, "205.0", "mg/dL", "125 - 200", "high", "2024-04-12", "2024-04-12", "Dr. Lal PathLabs", datetime.now(timezone.utc).isoformat()))

    # Appointments
    cursor.execute("""
        INSERT INTO appointments (id, patient_id, clinician_name, facility, appointment_time, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("apt_ram_01", "p_elderly_ramachandra", "Dr. K. V. Reddy", "Apollo Hospitals, Jubilee Hills", (datetime.now(timezone.utc) + timedelta(days=4, hours=3)).isoformat(), "Quarterly follow-up for blood pressure and glucose levels", "upcoming"))

    # Reminders
    cursor.execute("""
        INSERT INTO reminders (id, patient_id, title, reminder_time, repeat_pattern, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("rem_1", "p_elderly_ramachandra", "Morning Medication: Telmisartan 40mg", "08:30", "daily", 1))
    cursor.execute("""
        INSERT INTO reminders (id, patient_id, title, reminder_time, repeat_pattern, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("rem_2", "p_elderly_ramachandra", "Evening Medication: Metformin 500mg", "20:00", "daily", 1))

    conn.commit()
    conn.close()
    print("Demo seed data successfully written for all 4 personas!")

if __name__ == "__main__":
    seed_demo_data()
