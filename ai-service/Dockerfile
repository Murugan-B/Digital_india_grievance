# ============================================================
# Digital India AI Semantic Routing Service
# Deployment Dockerfile — Render Free / Hugging Face Spaces
# ============================================================
# Render Free tier : 512 MiB RAM limit — CPU-only torch is REQUIRED
# HF Spaces        : port 7860 (override CMD if deploying there)
# Local dev        : python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# ============================================================

# Python 3.11-slim — matches venv Python version, avoids unnecessary packages
FROM python:3.11-slim

LABEL maintainer="Digital India Grievance Portal"
LABEL description="AI Semantic Grievance Routing Microservice (Sentence-BERT, CPU-only)"
LABEL version="1.0.0"

# ---------------------------------------------------------------
# Python runtime flags
# ---------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ---------------------------------------------------------------
# PyTorch CPU thread limits
# Render Free provides 0.1–0.5 shared CPU cores.
# Limiting threads prevents thrashing and reduces peak RAM.
# ---------------------------------------------------------------
ENV OMP_NUM_THREADS=2
ENV MKL_NUM_THREADS=2
ENV TOKENIZERS_PARALLELISM=false

# ---------------------------------------------------------------
# HuggingFace / Sentence-Transformers cache paths
# Keeps model cache inside /app/.cache (writable, non-root safe)
# ---------------------------------------------------------------
ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence_transformers
# Disable HF Hub telemetry to reduce outbound traffic on cold start
ENV HF_HUB_DISABLE_TELEMETRY=1
# Disable progress bars in logs (cleaner Render log output)
ENV TQDM_DISABLE=1

# Pip hygiene
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# ---------------------------------------------------------------
# SECRETS — NOT hardcoded here.
#
# For Render:  Dashboard → Environment → Add Secret File / Env Vars
# For HF:      Space Settings → Variables and secrets
#
# Required secrets:
#   AI_SERVICE_SECRET    — Bearer token for /api/v1/route auth
#   SUPABASE_URL         — https://your-project.supabase.co
#   SUPABASE_SECRET_KEY  — Supabase service-role key
#
# Optional (config.py has sensible defaults):
#   AI_MODEL_NAME, AI_MODEL_VERSION, AI_CONFIDENCE_THRESHOLD,
#   AI_MARGIN_THRESHOLD, TOP_K
#
# PORT is injected automatically by Render at runtime.
# ---------------------------------------------------------------

# ---------------------------------------------------------------
# System dependencies
# ---------------------------------------------------------------
# libgomp1      : required by PyTorch for OpenMP threading (CPU inference)
# curl          : used by HEALTHCHECK
# build-essential removed — pre-built CPU wheels don't need GCC
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
 && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------
# Working directory
# ---------------------------------------------------------------
WORKDIR /app

# ---------------------------------------------------------------
# Step 1: Install CPU-only PyTorch FIRST (before requirements.txt)
# ---------------------------------------------------------------
# CRITICAL: Without --extra-index-url, pip resolves torch>=2.2.0 to
# the full CUDA wheel (~2.5 GB disk, ~400 MB additional runtime RAM).
# On Render Free (512 MiB), this causes an immediate OOM crash.
#
# The CPU wheel (torch+cpu) is ~250 MB disk and uses ~70 MB runtime RAM.
# Savings: ~300-400 MB RAM vs the default CUDA wheel.
#
# This step is BEFORE COPY requirements.txt so it is cached independently.
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        "torch>=2.2.0"

# ---------------------------------------------------------------
# Step 2: Install remaining dependencies
# ---------------------------------------------------------------
# torch is already installed above; pip will reuse it (satisfied constraint).
# --extra-index-url is repeated so pip resolves any torch sub-deps correctly.
COPY requirements.txt .
RUN pip install --no-cache-dir \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements.txt

# ---------------------------------------------------------------
# Step 3: Copy application source
# (.env, tests/, venv/, __pycache__ excluded via .dockerignore)
# ---------------------------------------------------------------
COPY app/ ./app/

# ---------------------------------------------------------------
# Pre-create model cache directories
# ---------------------------------------------------------------
RUN mkdir -p /app/.cache/huggingface \
             /app/.cache/sentence_transformers \
 && chmod -R 777 /app/.cache

# ---------------------------------------------------------------
# Non-root user (security + required by HF Spaces)
# ---------------------------------------------------------------
RUN useradd -m -u 1000 appuser \
 && chown -R appuser:appuser /app
USER appuser

# ---------------------------------------------------------------
# Port exposure
# Render injects $PORT dynamically (typically 10000).
# HF Spaces expects 7860. CMD below uses shell form to read $PORT.
# ---------------------------------------------------------------
EXPOSE 10000

# ---------------------------------------------------------------
# Health check
# Uses $PORT so it works on both Render and HF Spaces.
# start-period=90s: allows time for model download on first cold start.
# ---------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

# ---------------------------------------------------------------
# Start command
# Shell form (not exec form) so $PORT env variable is expanded at runtime.
# Render sets PORT automatically; HF Spaces users should override to 7860.
# workers=1: mandatory for singleton ModelService / DepartmentService pattern.
# ---------------------------------------------------------------
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1
