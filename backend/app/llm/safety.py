import re
from typing import Dict, Any, Optional, Tuple

EMERGENCY_KEYWORDS = [
    "chest pain", "pressure in chest", "shortness of breath", "trouble breathing",
    "can't breathe", "difficulty breathing", "stroke", "facial drooping",
    "arm weakness", "slurred speech", "suicide", "kill myself", "end my life",
    "severe bleeding", "unconscious", "anaphylaxis", "severe allergic reaction",
    "overdose", "coughing blood"
]

MEDICATION_CHANGE_KEYWORDS = [
    "double my dose", "increase my dose", "decrease my dose", "change my dose",
    "adjust my dose", "stop taking", "stop my medicine", "prescribe me",
    "what dose should i take", "should i take more", "can i take more"
]

HARDCODED_EMERGENCY_RESPONSE = """🚨 **URGENT EMERGENCY GUIDANCE**

If you or someone around you is experiencing life-threatening symptoms—such as acute chest pain, shortness of breath, stroke signs (facial droop, arm weakness, slurred speech), or severe trauma:

1. **Call Emergency Services immediately:**
   - **India:** Call **112** or **102** (Ambulance)
   - **US/Canada:** Call **911**
   - **UK:** Call **999**
2. **Do not wait:** Vitalis AI is an informational tool and cannot dispatch medical responders or provide emergency care.
3. If you are experiencing thoughts of self-harm or suicide, please call the national mental health helpline **KIRAN at 1800-599-0019** (India) or **988** (US/Canada).
"""

HARDCODED_DOSE_CHANGE_RESPONSE = """⚠️ **Important Medication Safety Notice**

Vitalis AI is designed to help you organize and understand your health documents, but **cannot make clinical decisions or adjust medication dosages**.

- **Do not alter or discontinue your medication dose** without speaking directly to your prescribing doctor or licensed pharmacist.
- Changing prescription dosages can have critical clinical consequences.
- Please consult your clinic or pharmacist for personalized clinical adjustments.
"""

def triage_message(user_message: str) -> Dict[str, Any]:
    """
    Deterministic safety triage backstop.
    Returns emergency or medication override if triggered.
    """
    msg_lower = user_message.lower().strip()

    # 1. Emergency Check
    for kw in EMERGENCY_KEYWORDS:
        if kw in msg_lower:
            return {
                "is_safe": False,
                "category": "emergency",
                "override_response": HARDCODED_EMERGENCY_RESPONSE,
                "flagged_keyword": kw
            }

    # 2. Medication alteration check
    for kw in MEDICATION_CHANGE_KEYWORDS:
        if kw in msg_lower:
            return {
                "is_safe": True, # safe to display, but intercepted with clinical referral
                "category": "medication_referral",
                "override_response": HARDCODED_DOSE_CHANGE_RESPONSE,
                "flagged_keyword": kw
            }

    return {
        "is_safe": True,
        "category": "routine",
        "override_response": None,
        "flagged_keyword": None
    }

def validate_llm_output(output_text: str) -> Tuple[bool, str]:
    """
    Scans LLM generation for forbidden patterns:
    - Definitive disease diagnosis: e.g. "You have diabetes", "You are suffering from"
    - Prescriptive dosing commands: e.g. "Increase your dose to", "Take 2 pills"
    """
    forbidden_patterns = [
        (r'(?i)\byou\s+(?:definitely\s+)?have\s+(?:diabetes|cancer|hypertension|anemia|kidney failure)\b', 
         "Definitive diagnosis detected in AI output"),
        (r'(?i)\bincrease\s+your\s+dose\s+to\b', "Dose increase instruction detected"),
        (r'(?i)\bstop\s+taking\s+your\s+(?:medication|medicine|tablets|insulin)\b', "Medication discontinuation instruction detected")
    ]

    for pattern, reason in forbidden_patterns:
        if re.search(pattern, output_text):
            return False, reason

    return True, "Passed safety checks"
