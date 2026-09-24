# ============================================================
# Digital India AI Semantic Routing Service
# Hugging Face Spaces Deployment Dockerfile
# Target port : 7860  (HF Spaces standard)
# Local dev   : python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# ============================================================

# --- Base image ---
# Python 3.11-slim: compatible with all pinned requirements.
# Does NOT require Rust toolchain for any package in requirements.txt.
FROM python:3.11-slim

# ---------------------------------------------------------------
# Labels
# ---------------------------------------------------------------
LABEL maintainer="Digital India Grievance Portal"
LABEL description="AI Semantic Grievance Routing Microservice (Sentence-BERT)"
LABEL version="1.0.0"

# ---------------------------------------------------------------
# Environment — no secrets here, only runtime tuning
# ---------------------------------------------------------------
# Prevent .pyc files being written inside the container
ENV PYTHONDONTWRITEBYTECODE=1
# Ensure stdout/stderr logs appear immediately (no buffering)
ENV PYTHONUNBUFFERED=1

# HuggingFace / Sentence-Transformers model cache paths
# HF Spaces allows writing to /app; model is downloaded once on first startup
ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence_transformers

# Limit CPU threads — avoids resource contention on HF Free tier CPUs
ENV OMP_NUM_THREADS=2
ENV MKL_NUM_THREADS=2

# Pip hygiene
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# ---------------------------------------------------------------
# SECRETS — NOT hardcoded here.
# Set the following as Hugging Face Spaces "Repository Secrets"
# (Space Settings → Variables and secrets):
#
#   AI_SERVICE_SECRET    — internal bearer token for /api/v1/route
#   SUPABASE_URL         — https://your-project.supabase.co
#   SUPABASE_SECRET_KEY  — Supabase service-role key (read-only)
#
# Optional (have sensible defaults in app/config.py):
#   AI_MODEL_NAME              (default: sentence-transformers/all-MiniLM-L6-v2)
#   AI_MODEL_VERSION           (default: 1.1)
#   AI_CONFIDENCE_THRESHOLD    (default: 0.65)
#   AI_MARGIN_THRESHOLD        (default: 0.05)
#   TOP_K                      (default: 3)
# ---------------------------------------------------------------

# ---------------------------------------------------------------
# System dependencies
# ---------------------------------------------------------------
# build-essential : required for numpy / torch C-extension compilation on slim
# libgomp1        : required by PyTorch for OpenMP threading support
# curl            : used by HEALTHCHECK below
# No Rust toolchain needed — none of the pinned packages require it.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
 && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------
# Working directory
# ---------------------------------------------------------------
WORKDIR /app

# ---------------------------------------------------------------
# Install Python dependencies (cached layer — only re-runs if
# requirements.txt changes)
# ---------------------------------------------------------------
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------
# Copy application source
# (tests/, venv/, .env, __pycache__ excluded via .dockerignore)
# ---------------------------------------------------------------
COPY app/ ./app/

# ---------------------------------------------------------------
# Pre-create model cache directories with open permissions.
# HF Spaces runs as uid=1000; pre-creating prevents runtime errors
# when sentence-transformers tries to download the model.
# ---------------------------------------------------------------
RUN mkdir -p /app/.cache/huggingface \
             /app/.cache/sentence_transformers \
 && chmod -R 777 /app/.cache

# ---------------------------------------------------------------
# Non-root user — security best practice; also required by HF Spaces
# ---------------------------------------------------------------
RUN useradd -m -u 1000 appuser \
 && chown -R appuser:appuser /app
USER appuser

# ---------------------------------------------------------------
# Expose HF Spaces standard port
# ---------------------------------------------------------------
EXPOSE 7860

# ---------------------------------------------------------------
# Health check — hits the existing /health endpoint defined in main.py
# start-period=60s allows time for model download on first cold start
# ---------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# ---------------------------------------------------------------
# Start command
# app.main:app — confirmed from app/main.py line 40: app = FastAPI(...)
# workers=1    — correct for singleton ModelService / DepartmentService pattern
# ---------------------------------------------------------------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
