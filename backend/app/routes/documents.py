import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
from app.config import settings
from app.db import get_db, log_audit
from app.pipeline.extractor import compute_file_hash, extract_document_content

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
MAX_FILE_SIZE = 20 * 1024 * 1024 # 20MB

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: Optional[str] = Form("general")
):
    # Verify patient belongs to user
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM patient_profiles WHERE id = ? AND user_id = 'user_judge_default'", (patient_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized patient profile")

    # Read bytes and validate
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        conn.close()
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (20MB)")

    # Real mime-type validation
    file_mime = file.content_type or "application/octet-stream"
    if file_mime not in ALLOWED_MIME_TYPES and not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg', '.webp')):
        conn.close()
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, PNG, JPG, or WEBP.")

    # Duplicate check via SHA256
    file_hash = compute_file_hash(content)
    cursor.execute("SELECT id, original_filename FROM documents WHERE patient_id = ? AND file_hash = ?", (patient_id, file_hash))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {
            "status": "duplicate",
            "message": f"This document was already uploaded as '{existing['original_filename']}'.",
            "document_id": existing["id"]
        }

    # Store file on disk securely
    ext = Path(file.filename).suffix.lower() or ".pdf"
    doc_id = f"doc_{uuid.uuid4().hex[:10]}"
    stored_name = f"{doc_id}{ext}"
    dest_path = settings.UPLOADS_PATH / stored_name

    with open(dest_path, "wb") as f:
        f.write(content)

    # Extract text & pages via pipeline
    try:
        extracted = extract_document_content(dest_path, file_mime)
        overall_conf = extracted["overall_confidence"]
        status = "uploaded" if overall_conf > 0.4 else "needs_review"
    except Exception as e:
        extracted = {"pages": [], "full_text": "", "overall_confidence": 0.0, "overall_quality": "failed"}
        status = "failed"

    # Insert into DB
    cursor.execute("""
        INSERT INTO documents (id, patient_id, original_filename, stored_filename, file_size, mime_type, file_hash, document_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, patient_id, file.filename, stored_name, len(content), file_mime, file_hash, document_type, status, datetime.utcnow().isoformat()))

    # Store pages
    for p in extracted["pages"]:
        p_id = f"page_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO document_pages (id, document_id, page_number, raw_text, ocr_confidence)
            VALUES (?, ?, ?, ?, ?)
        """, (p_id, doc_id, p["page_number"], p["text"], p["confidence"]))

    conn.commit()
    conn.close()

    log_audit("UPLOAD_DOCUMENT", "documents", doc_id, "user_judge_default")

    return {
        "status": "success",
        "document_id": doc_id,
        "filename": file.filename,
        "document_type": document_type,
        "page_count": len(extracted["pages"]),
        "ocr_confidence": extracted["overall_confidence"],
        "ocr_quality": extracted["overall_quality"],
        "raw_text_preview": extracted["full_text"][:300]
    }

@router.get("")
def list_documents(patient_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if patient_id:
        cursor.execute("""
            SELECT id, patient_id, original_filename, file_size, mime_type, document_type, status, created_at
            FROM documents
            WHERE patient_id = ?
            ORDER BY created_at DESC
        """, (patient_id,))
    else:
        cursor.execute("""
            SELECT d.id, d.patient_id, p.full_name as patient_name, d.original_filename, d.file_size, d.mime_type, d.document_type, d.status, d.created_at
            FROM documents d
            JOIN patient_profiles p ON d.patient_id = p.id
            WHERE p.user_id = 'user_judge_default'
            ORDER BY d.created_at DESC
        """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.get("/{document_id}")
def get_document(document_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (document_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    cursor.execute("SELECT page_number, raw_text, ocr_confidence FROM document_pages WHERE document_id = ? ORDER BY page_number ASC", (document_id,))
    pages = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "document": dict(doc),
        "pages": pages
    }

@router.delete("/{document_id}")
def delete_document(document_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT stored_filename FROM documents WHERE id = ?", (document_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete physical file
    file_path = settings.UPLOADS_PATH / doc["stored_filename"]
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception:
            pass

    cursor.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    conn.commit()
    conn.close()
    log_audit("DELETE_DOCUMENT", "documents", document_id, "user_judge_default")
    return {"status": "success", "deleted_id": document_id}
