import os
import hashlib
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pymupdf # PyMuPDF
from PIL import Image, ImageEnhance, ImageFilter

def compute_file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

def preprocess_image(image_path: Path) -> Image.Image:
    """Preprocess image for better OCR readability (denoise, contrast enhancement)"""
    img = Image.open(image_path).convert('L') # Grayscale
    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.8)
    return img

def calculate_text_quality(text: str) -> Dict[str, Any]:
    """Calculate character sanity, vocabulary ratio and confidence score"""
    if not text or len(text.strip()) == 0:
        return {"confidence": 0.0, "quality": "unreadable", "char_count": 0}
        
    clean_text = text.strip()
    total_chars = len(clean_text)
    
    # Alphanumeric ratio
    alnum_chars = sum(1 for c in clean_text if c.isalnum() or c.isspace())
    sanity_ratio = alnum_chars / max(1, total_chars)
    
    # Check for garbage/gibberish (too many consecutive symbols)
    has_heavy_noise = bool(re.search(r'[^\w\s]{4,}', clean_text))
    
    base_confidence = 0.95 if sanity_ratio > 0.85 else 0.75 if sanity_ratio > 0.65 else 0.40
    if has_heavy_noise:
        base_confidence = max(0.2, base_confidence - 0.25)
        
    quality = "high" if base_confidence > 0.8 else "medium" if base_confidence > 0.5 else "low"
    
    return {
        "confidence": round(base_confidence, 2),
        "quality": quality,
        "char_count": total_chars,
        "sanity_ratio": round(sanity_ratio, 2)
    }

def extract_document_content(file_path: Path, mime_type: str) -> Dict[str, Any]:
    """
    Extracts text and page structure from PDF or image documents.
    Uses PyMuPDF for PDFs and PIL heuristics / fallback for images.
    """
    pages_data: List[Dict[str, Any]] = []
    full_text = ""
    
    if "pdf" in mime_type.lower() or file_path.suffix.lower() == ".pdf":
        doc = pymupdf.open(str(file_path))
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_text = page.get_text("text")
            
            # If page text is very sparse, it might be a scanned PDF page
            quality = calculate_text_quality(page_text)
            
            pages_data.append({
                "page_number": page_idx + 1,
                "text": page_text,
                "confidence": quality["confidence"],
                "quality": quality["quality"]
            })
            full_text += f"\n--- Page {page_idx + 1} ---\n" + page_text
        doc.close()
    else:
        # Image file (PNG, JPG, WEBP)
        try:
            img = preprocess_image(file_path)
            # Text extraction: check for pytesseract
            image_text = ""
            try:
                import pytesseract
                image_text = pytesseract.image_to_string(img, lang="eng")
            except Exception:
                image_text = ""
                
            quality = calculate_text_quality(image_text)
            pages_data.append({
                "page_number": 1,
                "text": image_text,
                "confidence": quality["confidence"],
                "quality": quality["quality"]
            })
            full_text = image_text
        except Exception as e:
            pages_data.append({
                "page_number": 1,
                "text": "",
                "confidence": 0.0,
                "quality": "unreadable"
            })
            
    overall_quality = calculate_text_quality(full_text)
    
    return {
        "pages": pages_data,
        "full_text": full_text.strip(),
        "page_count": len(pages_data),
        "overall_confidence": overall_quality["confidence"],
        "overall_quality": overall_quality["quality"]
    }
