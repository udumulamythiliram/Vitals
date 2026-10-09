from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.llm.gateway import llm_gateway
from app.seed_data import seed_demo_data

router = APIRouter(prefix="/api/system", tags=["system"])

class LLMConfigUpdate(BaseModel):
    api_key: str
    provider: str # gemini | groq | openai | openrouter
    model: Optional[str] = None

@router.get("/status")
async def get_system_status():
    llm_health = await llm_gateway.check_health()
    return {
        "status": "online",
        "app_version": settings.VERSION,
        "database": "SQLite 3 (WAL mode active)",
        "ocr_engine": "PyMuPDF native text + PIL preprocessing pipeline (Active)",
        "llm_gateway": llm_health,
        "active_provider": llm_gateway.provider,
        "active_model": llm_gateway.primary_model,
        "is_fallback": llm_health.get("is_fallback", False)
    }

@router.post("/configure-llm")
async def configure_llm(data: LLMConfigUpdate):
    llm_gateway.update_credentials(data.api_key, data.provider, data.model)
    health = await llm_gateway.check_health()
    return {
        "status": "updated",
        "health": health
    }

@router.post("/reset-demo")
def reset_demo():
    seed_demo_data()
    return {"status": "success", "message": "Demo data reset to clean initial state."}
