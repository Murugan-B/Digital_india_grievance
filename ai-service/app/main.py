import logging
import hashlib
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.schemas import HealthResponse
from app.services.model_service import model_service
from app.services.department_service import department_service
from app.routes.routing import router as routing_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("ai-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI Semantic Routing Service...")
    
    # 1. Preload Sentence Transformers Model once at startup
    try:
        model_service.load_model()
    except Exception as e:
        logger.error(f"Failed to preload model: {e}")
        
    # 2. Preload active departments and embeddings from Supabase

    # ----------------------------------------------------------------
    # TEMPORARY DIAGNOSTIC — remove after Render secret is confirmed
    # Logs safe metadata about the Supabase credentials WITHOUT
    # printing the actual key value.
    # ----------------------------------------------------------------
    _url = settings.SUPABASE_URL or ""
    _key = settings.SUPABASE_SECRET_KEY or ""
    _key_sha256 = hashlib.sha256(_key.encode("utf-8")).hexdigest() if _key else "(empty)"
    logger.info("[DIAGNOSTIC] SUPABASE_URL=%s", _url)
    logger.info("[DIAGNOSTIC] SUPABASE_SECRET_KEY_PRESENT=%s", str(bool(_key)).lower())
    logger.info("[DIAGNOSTIC] SUPABASE_SECRET_KEY_LENGTH=%d", len(_key))
    logger.info("[DIAGNOSTIC] SUPABASE_SECRET_KEY_SHA256=%s", _key_sha256)
    # ----------------------------------------------------------------
    # END TEMPORARY DIAGNOSTIC
    # ----------------------------------------------------------------

    try:
        if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY:
            department_service.load_departments()
        else:
            logger.warning("SUPABASE_URL or SUPABASE_SECRET_KEY not set during initial startup.")
    except Exception as e:
        logger.warning(f"Could not load departments from Supabase on startup: {e}")

    logger.info("AI Semantic Routing Service initialized and ready.")
    yield
    logger.info("Shutting down AI Semantic Routing Service...")

app = FastAPI(
    title="Digital India Public Grievance AI Semantic Routing Service",
    description="Internal microservice for Sentence-BERT semantic grievance classification and departmental routing",
    version="1.0.0",
    lifespan=lifespan
)

# Mount Routes
app.include_router(routing_router)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    return HealthResponse(
        status="healthy",
        model_loaded=model_service.is_loaded,
        model_name=settings.AI_MODEL_NAME,
        departments_count=department_service.departments_count
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
