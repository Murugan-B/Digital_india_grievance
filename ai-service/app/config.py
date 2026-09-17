import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Sentence Transformers Model
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    AI_MODEL_VERSION: str = os.getenv("AI_MODEL_VERSION", "1.1")
    
    # Classification Thresholds
    AI_CONFIDENCE_THRESHOLD: float = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.65"))
    AI_MARGIN_THRESHOLD: float = float(os.getenv("AI_MARGIN_THRESHOLD", "0.05"))
    TOP_K: int = int(os.getenv("TOP_K", "3"))
    
    # Internal Service Authentication Secret
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "digital-india-ai-internal-key-2026")
    
    # Supabase Connection
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")

settings = Settings()
