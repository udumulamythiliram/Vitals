import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "Vitalis AI - Personal Health Copilot"
    VERSION: str = "2.0.0"
    DB_PATH: Path = DATA_DIR / "vitalis.db"
    UPLOADS_PATH: Path = UPLOADS_DIR
    
    # LLM Settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq") # gemini | openai | groq | openrouter
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    LLM_FALLBACK_MODEL: str = os.getenv("LLM_FALLBACK_MODEL", "llama-3.1-8b-instant")
    
    # Fallback / Local simulation mode indicator
    ALLOW_MOCK_FALLBACK: bool = True

settings = Settings()
