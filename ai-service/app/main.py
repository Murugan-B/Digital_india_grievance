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
    # TEMPORARY DIAGNOSTIC — remove after Render issue is resolved
    # Phase 1: credential metadata (no key value printed)
    # Phase 2: direct httpx REST call — identical to local test that
    #          returned HTTP 200 — to isolate whether Supabase itself
    #          rejects the Render request vs SDK/env difference.
    # ----------------------------------------------------------------
    import httpx as _httpx

    _url = settings.SUPABASE_URL or ""
    _key = settings.SUPABASE_SECRET_KEY or ""
    _key_sha256 = hashlib.sha256(_key.encode("utf-8")).hexdigest() if _key else "(empty)"

    # Phase 1 — credential fingerprint
    logger.info("[DIAGNOSTIC-1] SUPABASE_URL=%s", _url)
    logger.info("[DIAGNOSTIC-1] SUPABASE_SECRET_KEY_PRESENT=%s", str(bool(_key)).lower())
    logger.info("[DIAGNOSTIC-1] SUPABASE_SECRET_KEY_LENGTH=%d", len(_key))
    logger.info("[DIAGNOSTIC-1] SUPABASE_SECRET_KEY_SHA256=%s", _key_sha256)

    # Phase 2 — direct REST probe (same headers as the supabase SDK)
    # This fires BEFORE the SDK call below, so we get an independent data point.
    if _url and _key:
        try:
            _diag_resp = _httpx.get(
                _url + "/rest/v1/departments",
                params={"select": "id"},
                headers={
                    "apikey":        _key,
                    "Authorization": "Bearer " + _key,
                },
                timeout=10.0,
                follow_redirects=True,
            )
            _body = _diag_resp.text
            # Sanitize: log only status, content-type, length, first 120 chars
            _safe_body = _body[:120].replace("\n", " ").replace("\r", "")
            logger.info("[DIAGNOSTIC-2] DIRECT_HTTP_STATUS=%d", _diag_resp.status_code)
            logger.info("[DIAGNOSTIC-2] DIRECT_HTTP_CONTENT_TYPE=%s",
                        _diag_resp.headers.get("content-type", "(none)"))
            logger.info("[DIAGNOSTIC-2] DIRECT_HTTP_BODY_LENGTH=%d", len(_body))
            logger.info("[DIAGNOSTIC-2] DIRECT_HTTP_BODY_FIRST_120=%r", _safe_body)
        except Exception as _diag_exc:
            logger.warning("[DIAGNOSTIC-2] DIRECT_HTTP_EXCEPTION=%s: %s",
                           type(_diag_exc).__name__, str(_diag_exc))
    else:
        logger.warning("[DIAGNOSTIC-2] SKIPPED — URL or KEY missing")
    # ----------------------------------------------------------------
    # END TEMPORARY DIAGNOSTIC
    # ----------------------------------------------------------------

    # ----------------------------------------------------------------
    # TEMPORARY DIAGNOSTIC-FS — inspect physical department_service.py
    # ----------------------------------------------------------------
    import inspect as _inspect
    import app.services.department_service as _ds_module

    _mod_file = getattr(_ds_module, "__file__", None)
    _cls_file = _inspect.getfile(department_service.__class__) if hasattr(department_service, "__class__") else None

    logger.info("[DIAGNOSTIC-FS] IMPORTED_MODULE_FILE=%s", _mod_file)
    logger.info("[DIAGNOSTIC-FS] CLASS_DEFINED_FILE=%s", _cls_file)

    # Check potential runtime paths
    _probe_paths = list(filter(None, [
        _mod_file,
        "/app/app/services/department_service.py",
        "app/services/department_service.py"
    ]))
    _seen_paths = set()

    for _p in _probe_paths:
        if _p in _seen_paths:
            continue
        _seen_paths.add(_p)
        _f_exists = os.path.exists(_p)
        logger.info("[DIAGNOSTIC-FS] PATH=%s EXISTS=%s", _p, str(_f_exists).lower())
        if _f_exists:
            try:
                with open(_p, "rb") as _f:
                    _content = _f.read()
                _f_size = len(_content)
                _f_sha = hashlib.sha256(_content).hexdigest()
                _f_text = _content.decode("utf-8", errors="replace")
                _has_d3 = "DIAGNOSTIC-3" in _f_text
                _has_d4 = "DIAGNOSTIC-4-BEFORE" in _f_text
                logger.info("[DIAGNOSTIC-FS] PATH=%s SIZE=%d SHA256=%s HAS_D3=%s HAS_D4=%s",
                            _p, _f_size, _f_sha, str(_has_d3).lower(), str(_has_d4).lower())
                
                # Find first matching line for DIAGNOSTIC-3
                _lines = _f_text.splitlines()
                _d3_match = None
                for _idx, _line in enumerate(_lines, start=1):
                    if "DIAGNOSTIC-3" in _line:
                        _d3_match = (_idx, _line.strip())
                        break
                if _d3_match:
                    logger.info("[DIAGNOSTIC-FS] FIRST_D3_LINE_NUM=%d CONTENT=%r", _d3_match[0], _d3_match[1])
                else:
                    logger.info("[DIAGNOSTIC-FS] FIRST_D3_LINE_NUM=NONE")
            except Exception as _read_err:
                logger.warning("[DIAGNOSTIC-FS] READ_ERROR for %s: %s", _p, _read_err)
    # ----------------------------------------------------------------
    # END TEMPORARY DIAGNOSTIC-FS
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
