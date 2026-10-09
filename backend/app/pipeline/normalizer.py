import re
from datetime import datetime
from typing import Optional, Dict, Any, List

COMMON_MEDICATIONS: List[str] = [
    "Paracetamol", "Acetaminophen", "Metformin", "Amlodipine", "Telmisartan",
    "Atorvastatin", "Pantoprazole", "Amoxicillin", "Cetirizine", "Azithromycin",
    "Levothyroxine", "Losartan", "Omeprazole", "Montelukast", "Rosuvastatin",
    "Metoprolol", "Gliclazide", "Glimepiride", "Vildagliptin", "Insulin Glargine",
    "Aspirin", "Clopidogrel", "Ciprofloxacin", "Doxycycline", "Ibuprofen",
    "Ranitidine", "Domperidone", "Rabeprazole", "Thyroxine", "Salbutamol"
]

FREQUENCY_MAP: Dict[str, str] = {
    "od": "Once daily",
    "qd": "Once daily",
    "once daily": "Once daily",
    "bd": "Twice daily",
    "bid": "Twice daily",
    "twice daily": "Twice daily",
    "tds": "Three times daily",
    "tid": "Three times daily",
    "thrice daily": "Three times daily",
    "qid": "Four times daily",
    "hs": "At bedtime",
    "qhs": "At bedtime",
    "bedtime": "At bedtime",
    "sos": "As needed (PRN)",
    "prn": "As needed (PRN)",
    "stat": "Immediately (single dose)",
}

def match_medication_name(raw_name: str) -> Dict[str, Any]:
    """Matches a noisy OCR drug string against verified medical list"""
    clean = raw_name.strip()
    clean_lower = clean.lower()
    
    # Direct match
    for med in COMMON_MEDICATIONS:
        if med.lower() == clean_lower:
            return {"canonical_name": med, "confidence": 0.98, "is_known": True}
            
    # Substring or fuzzy prefix match
    for med in COMMON_MEDICATIONS:
        if med.lower() in clean_lower or clean_lower in med.lower():
            if len(clean_lower) >= 4:
                return {"canonical_name": med, "confidence": 0.85, "is_known": True}
                
    return {"canonical_name": clean, "confidence": 0.65, "is_known": False}

def normalize_frequency(freq_str: Optional[str]) -> str:
    if not freq_str:
        return "As directed by physician"
    clean = freq_str.strip().lower()
    return FREQUENCY_MAP.get(clean, freq_str.strip())

def parse_iso_date(date_str: Optional[str]) -> Optional[str]:
    """Tries parsing various date formats (DD/MM/YYYY, YYYY-MM-DD, Month DD YYYY) into ISO YYYY-MM-DD"""
    if not date_str:
        return None
    clean = date_str.strip()
    
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y",
        "%d %b %Y", "%d %B %Y", "%b %d, %Y", "%B %d, %Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(clean, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    # Regex fallback for DD/MM/YYYY
    match = re.search(r'(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})', clean)
    if match:
        d, m, y = match.groups()
        try:
            return f"{y}-{int(m):02d}-{int(d):02d}"
        except Exception:
            pass
            
    return None
