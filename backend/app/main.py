import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import init_db, get_db
from app.seed_data import seed_demo_data

from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.documents import router as documents_router
from app.routes.extraction import router as extraction_router
from app.routes.summaries import router as summaries_router
from app.routes.chat import router as chat_router
from app.routes.timeline import router as timeline_router
from app.routes.medications import router as medications_router
from app.routes.trends import router as trends_router
from app.routes.appointments import router as appointments_router
from app.routes.fhir import router as fhir_router
from app.routes.privacy import router as privacy_router
from app.routes.evals import router as evals_router
from app.routes.system import router as system_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Vitalis AI - Personal Health Copilot Backend with real OCR, deterministic lab flagging, and multi-provider LLM gateway."
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
settings.UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_PATH)), name="uploads")

# Include Routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(documents_router)
app.include_router(extraction_router)
app.include_router(summaries_router)
app.include_router(chat_router)
app.include_router(timeline_router)
app.include_router(medications_router)
app.include_router(trends_router)
app.include_router(appointments_router)
app.include_router(fhir_router)
app.include_router(privacy_router)
app.include_router(evals_router)
app.include_router(system_router)

@app.on_event("startup")
def startup_event():
    init_db()
    # Check if seed user exists
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE id = 'user_judge_default'")
    cnt = cursor.fetchone()["count"]
    conn.close()
    if cnt == 0:
        seed_demo_data()

@app.get("/")
def root():
    return {
        "app": "Vitalis AI",
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health/llm")
async def health_llm():
    from app.llm.gateway import llm_gateway
    return await llm_gateway.check_health()
