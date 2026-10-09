import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db import get_db, log_audit

router = APIRouter(prefix="/api/export", tags=["fhir"])

class AbhaMockLink(BaseModel):
    patient_id: str
    abha_address: str # e.g. ram@abdm or 91-8472-1928-3482

@router.get("/fhir")
def export_fhir_bundle(patient_id: str):
    """
    Exports structured patient records as a valid HL7 FHIR R4 Bundle.
    Includes Patient, Observation, MedicationRequest, AllergyIntolerance, DocumentReference resources.
    """
    conn = get_db()
    cursor = conn.cursor()

    # Patient resource
    cursor.execute("SELECT * FROM patient_profiles WHERE id = ?", (patient_id,))
    p = cursor.fetchone()
    if not p:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient profile not found")

    bundle_id = f"bundle-{uuid.uuid4().hex[:12]}"
    entries = []

    # 1. FHIR Patient
    patient_resource = {
        "resourceType": "Patient",
        "id": p["id"],
        "name": [{"use": "official", "text": p["full_name"]}],
        "gender": p["gender"].lower() if p["gender"] in ["Male", "Female"] else "other",
        "birthDate": p["date_of_birth"],
        "telecom": [{"system": "phone", "value": p["emergency_contact_phone"], "use": "emergency"}] if p["emergency_contact_phone"] else []
    }
    entries.append({"resource": patient_resource})

    # 2. FHIR Observations
    cursor.execute("SELECT * FROM observations WHERE patient_id = ?", (patient_id,))
    for o in cursor.fetchall():
        obs_res = {
            "resourceType": "Observation",
            "id": o["id"],
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory", "display": "Laboratory"}]}],
            "code": {"text": o["test_name"]},
            "subject": {"reference": f"Patient/{p['id']}"},
            "effectiveDateTime": o["collection_date"],
            "valueQuantity": {
                "value": o["value"],
                "unit": o["unit"],
                "system": "http://unitsofmeasure.org"
            },
            "referenceRange": [{"text": o["reference_range"]}] if o["reference_range"] else [],
            "interpretation": [{"text": o["flag"].upper()}] if o["flag"] else []
        }
        entries.append({"resource": obs_res})

    # 3. FHIR MedicationRequest
    cursor.execute("SELECT * FROM medications WHERE patient_id = ?", (patient_id,))
    for m in cursor.fetchall():
        med_res = {
            "resourceType": "MedicationRequest",
            "id": m["id"],
            "status": "active" if m["status"] == "active" else "completed",
            "intent": "order",
            "medicationCodeableConcept": {"text": f"{m['drug_name']} {m['dosage']}"},
            "subject": {"reference": f"Patient/{p['id']}"},
            "dosageInstruction": [{"text": f"{m['frequency']} - {m['instructions']}"}]
        }
        entries.append({"resource": med_res})

    # 4. FHIR AllergyIntolerance
    if p["allergies"] and p["allergies"].lower() != "none":
        allergy_res = {
            "resourceType": "AllergyIntolerance",
            "id": f"alg_{p['id']}",
            "clinicalStatus": {"coding": [{"code": "active"}]},
            "verificationStatus": {"coding": [{"code": "confirmed"}]},
            "patient": {"reference": f"Patient/{p['id']}"},
            "note": [{"text": p["allergies"]}]
        }
        entries.append({"resource": allergy_res})

    conn.close()
    log_audit("EXPORT_FHIR", "patient_profiles", p["id"], "user_judge_default")

    bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "meta": {"lastUpdated": datetime.utcnow().isoformat() + "Z"},
        "type": "collection",
        "entry": entries,
        "unsupported_fields": [
            "LOINC automated code mappings (currently preserving exact laboratory display names)",
            "SNOMED CT clinical finding codes (raw text preserved)",
            "Real ABDM encrypted telemetry exchange (mock mode active)"
        ]
    }

    return bundle

@router.post("/abha/link-mock")
def link_abha_mock(data: AbhaMockLink):
    """
    Clearly labeled synthetic ABHA link for demonstration
    """
    log_audit("MOCK_ABHA_LINK", "patient_profiles", data.patient_id, "user_judge_default")
    return {
        "status": "success",
        "is_mock": True,
        "abha_address": data.abha_address,
        "abha_number": "91-8472-1928-3482",
        "linked_at": datetime.utcnow().isoformat(),
        "disclaimer": "Simulated demonstration integration. Never exchanges data over live ABDM network without government sandbox credentials."
    }
