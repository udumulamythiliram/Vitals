import re
from typing import Optional, Tuple, Dict, Any

# Standard clinical reference ranges (used when report doesn't specify one or for sanity validation)
CLINICAL_STANDARDS: Dict[str, Dict[str, Any]] = {
    "hemoglobin": {"min": 12.0, "max": 16.5, "unit": "g/dL", "name": "Hemoglobin"},
    "fasting blood sugar": {"min": 70.0, "max": 100.0, "unit": "mg/dL", "name": "Fasting Blood Sugar"},
    "fbs": {"min": 70.0, "max": 100.0, "unit": "mg/dL", "name": "Fasting Blood Sugar"},
    "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "name": "HbA1c (Glycated Hemoglobin)"},
    "total cholesterol": {"min": 125.0, "max": 200.0, "unit": "mg/dL", "name": "Total Cholesterol"},
    "ldl cholesterol": {"min": 0.0, "max": 100.0, "unit": "mg/dL", "name": "LDL Cholesterol"},
    "hdl cholesterol": {"min": 40.0, "max": 60.0, "unit": "mg/dL", "name": "HDL Cholesterol"},
    "triglycerides": {"min": 0.0, "max": 150.0, "unit": "mg/dL", "name": "Serum Triglycerides"},
    "serum creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL", "name": "Serum Creatinine"},
    "tsh": {"min": 0.4, "max": 4.5, "unit": "uIU/mL", "name": "Thyroid Stimulating Hormone (TSH)"},
    "platelet count": {"min": 150000, "max": 450000, "unit": "/mcL", "name": "Platelet Count"},
    "wbc count": {"min": 4000, "max": 11000, "unit": "/mcL", "name": "White Blood Cell Count"},
    "total bilirubin": {"min": 0.2, "max": 1.2, "unit": "mg/dL", "name": "Total Bilirubin"},
    "sgpt (alt)": {"min": 7.0, "max": 56.0, "unit": "U/L", "name": "ALT / SGPT"},
    "sgot (ast)": {"min": 10.0, "max": 40.0, "unit": "AST / SGOT", "name": "AST / SGOT"},
    "blood urea": {"min": 15.0, "max": 40.0, "unit": "mg/dL", "name": "Blood Urea Nitrogen"},
    "uric acid": {"min": 3.5, "max": 7.2, "unit": "mg/dL", "name": "Serum Uric Acid"},
    "vitamin d": {"min": 30.0, "max": 100.0, "unit": "ng/mL", "name": "Vitamin D (25-OH)"},
    "vitamin b12": {"min": 200.0, "max": 900.0, "unit": "pg/mL", "name": "Vitamin B12"},
}

def parse_reference_range(range_str: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    """Parse range strings like '12.0 - 16.5', '< 200', '> 50', '70 to 100'"""
    if not range_str:
        return None, None
    clean = range_str.strip().lower()
    
    # Match '< X' or '<= X'
    less_than = re.search(r'(?:<|<=|less than)\s*([\d.]+)', clean)
    if less_than:
        return 0.0, float(less_than.group(1))
        
    # Match '> X' or '>= X'
    greater_than = re.search(r'(?:>|>=|greater than)\s*([\d.]+)', clean)
    if greater_than:
        return float(greater_than.group(1)), None
        
    # Match 'X - Y' or 'X to Y' or 'X — Y'
    range_match = re.search(r'([\d.]+)\s*(?:-|–|—|to)\s*([\d.]+)', clean)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
        
    return None, None

def evaluate_lab_value(test_name: str, value: float, report_range_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Deterministic rule engine for evaluating lab test values.
    NEVER relies on LLM to guess high/low. Follows strict clinical boundary logic.
    """
    low, high = parse_reference_range(report_range_str)
    
    # Fallback to clinical standard if report provided no range
    std_key = test_name.lower().strip()
    matched_std = None
    for k, v in CLINICAL_STANDARDS.items():
        if k in std_key or std_key in k:
            matched_std = v
            break
            
    using_standard = False
    if low is None and high is None and matched_std:
        low = matched_std["min"]
        high = matched_std["max"]
        using_standard = True

    flag = "normal"
    explanation = "Within standard reference range."
    
    if low is not None and value < low:
        # Check critical low threshold (e.g. 50% below min)
        if low > 0 and value < (low * 0.6):
            flag = "critical_low"
            explanation = f"Critically below reference range ({low} - {high or 'N/A'})."
        else:
            flag = "low"
            explanation = f"Below printed reference range ({low} - {high or 'N/A'})."
    elif high is not None and value > high:
        # Check critical high threshold (e.g. 50% above max)
        if value > (high * 1.5):
            flag = "critical_high"
            explanation = f"Significantly above reference range ({low or 'N/A'} - {high})."
        else:
            flag = "high"
            explanation = f"Above printed reference range ({low or 'N/A'} - {high})."
    elif low is None and high is None:
        flag = "unspecified"
        explanation = "No reference range provided in report."

    return {
        "flag": flag,
        "is_abnormal": flag not in ["normal", "unspecified"],
        "min": low,
        "max": high,
        "used_standard": using_standard,
        "explanation": explanation
    }
