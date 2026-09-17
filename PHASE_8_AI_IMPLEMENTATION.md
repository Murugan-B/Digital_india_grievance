# Phase 8: AI Semantic Grievance Routing Foundation

## Executive Summary
Phase 8 implements automated AI semantic grievance classification and departmental routing for the **Digital India Multi-Lingual Public Grievance Redressal Portal**. Using **Sentence Transformers / SBERT** (`sentence-transformers/all-MiniLM-L6-v2`), incoming citizen grievances are semantically embedded and classified against the master department catalogue stored in Supabase (`public.departments`).

---

## 1. System Architecture

```
+-------------------------------------------------------------------------------+
|                                React Frontend                                 |
|               (Citizen submits grievance via authenticated UI)                |
+-------------------------------------------------------------------------------+
                                      |
                                      v HTTP POST /api/grievances (Bearer JWT)
+-------------------------------------------------------------------------------+
|                             Node.js + Express API                             |
|  1. Inserts grievance into public.grievances with department = NULL           |
|  2. Calls internal AI Routing Service with Bearer AI_SERVICE_SECRET           |
+-------------------------------------------------------------------------------+
                                      |
                                      v HTTP POST /api/v1/route (Internal Only)
+-------------------------------------------------------------------------------+
|                          Python FastAPI AI Service                            |
|  1. Preloads sentence-transformers/all-MiniLM-L6-v2 at startup (singleton)    |
|  2. Fetches active departments from Supabase public.departments               |
|  3. Generates 384-dimensional normalized dense vector embeddings              |
|  4. Calculates cosine similarity across all active department embeddings      |
|  5. Sorts Top-K predictions descending by similarity score                    |
|  6. Evaluates confidence against AI_CONFIDENCE_THRESHOLD (default: 0.65)      |
|  7. Returns { predicted_department, confidence_score, routing_status, ... }  |
+-------------------------------------------------------------------------------+
                                      |
                                      v Returns JSON Prediction Response
+-------------------------------------------------------------------------------+
|                      Node.js Post-Routing Validation                          |
|  1. Validates predicted_department exists in public.departments               |
|  2. Inserts immutable audit entry into public.grievance_ai_routings           |
|  3. Routing Decision:                                                         |
|     * If status == 'completed' & dept is valid:                               |
|       UPDATE grievances SET department = predicted_department                 |
|     * If status == 'flagged_for_review' or confidence < 0.65:                 |
|       Grievance department remains NULL (Unassigned / Pending Review)         |
|     * If AI service offline or error:                                         |
|       Grievance department remains NULL (Safe Failover)                       |
+-------------------------------------------------------------------------------+
```

---

## 2. Key Components & Implementation Details

### A. Python AI Microservice (`ai-service/`)
- **FastAPI Application (`app/main.py`)**: Uses lifespan context manager to load the Sentence Transformer model and cache department embeddings on startup.
- **Model Loader (`app/services/model_service.py`)**: Singleton pattern ensuring `all-MiniLM-L6-v2` is loaded into memory exactly once and never re-initialized per request.
- **Department Vectorizer (`app/services/department_service.py`)**: Queries `public.departments` in Supabase, normalizes descriptions, and generates semantic vector cache.
- **Internal Authentication (`app/routes/routing.py`)**: Validates internal requests using `Authorization: Bearer <AI_SERVICE_SECRET>`.

### B. Node.js Backend Integration (`backend/`)
- **`src/services/aiRoutingService.js`**:
  - `callAIService(subject, description)`: Makes internal HTTP call with timeout.
  - `validateDepartment(departmentName)`: Verifies department exists in `public.departments`.
  - `recordAIRoutingAudit(...)`: Inserts routing attempts into `public.grievance_ai_routings`.
  - `processGrievanceRouting(grievance)`: Coordinates full lifecycle and updates `grievances.department` when confidence >= 0.65.
- **`src/controllers/grievanceController.js`**:
  - Automatically triggers `AIRoutingService.processGrievanceRouting` after grievance creation.

---

## 3. Configuration & Environment Variables

### Python AI Service (`ai-service/.env`)
| Variable | Value / Example | Purpose |
|---|---|---|
| `PORT` | `8000` | Port for AI microservice |
| `HOST` | `0.0.0.0` | Bind host |
| `AI_MODEL_NAME` | `sentence-transformers/all-MiniLM-L6-v2` | SBERT embedding model |
| `AI_MODEL_VERSION` | `1.0` | Model version tag |
| `AI_CONFIDENCE_THRESHOLD` | `0.65` | Confidence threshold for auto-assignment |
| `TOP_K` | `3` | Number of candidate departments returned |
| `AI_SERVICE_SECRET` | *(configured)* | Shared secret for internal microservice authentication |
| `SUPABASE_URL` | `https://fadnelkafxupsptffhik.supabase.co` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | *(configured)* | Secret key for fetching department catalogue |

### Node.js Backend (`backend/.env`)
| Variable | Value / Example | Purpose |
|---|---|---|
| `AI_SERVICE_URL` | `http://127.0.0.1:8000` | Local URL for internal AI service |
| `AI_SERVICE_SECRET` | *(configured)* | Shared secret matching AI service |

---

## 4. Confidence Threshold & Routing Rules

1. **High Confidence (`score >= 0.65`)**:
   - `routing_status = "completed"`
   - `grievances.department` is updated with validated predicted department.
   - Visible to corresponding department officials on the Official Dashboard.
2. **Low Confidence (`score < 0.65`)**:
   - `routing_status = "flagged_for_review"`
   - `grievances.department` remains `NULL`.
   - Labeled as **"Pending AI Routing / Unassigned"** in dashboards.
3. **AI Service Outage / Network Error**:
   - Fails gracefully without throwing uncaught exceptions.
   - `grievances.department` remains `NULL`.
   - Citizen submission response returns `201 Created` with no data loss.

---

## 5. Verification & Test Results

### 1. Python Pytest Unit & Routing Suite (`ai-service/tests/test_ai_service.py`):
- `test_health_endpoint`: **PASSED** (200 OK, `model_loaded: true`, 8 active departments).
- `test_routing_missing_auth`: **PASSED** (401 Unauthorized).
- `test_routing_invalid_auth`: **PASSED** (401 Unauthorized).
- `test_routing_empty_subject`: **PASSED** (422 Unprocessable Entity).
- `test_routing_empty_description`: **PASSED** (422 Unprocessable Entity).
- `test_valid_grievance_high_confidence`: **PASSED** (Correct SBERT match & score).
- `test_low_confidence_prediction`: **PASSED** (`flagged_for_review` status).
- `test_no_active_departments`: **PASSED** (503 Service Unavailable).

### 2. Node Backend AI Integration Suite (`backend/tests/test_ai_routing_integration.js`):
- `[Test 1] Supabase Active Departments Catalogue`: **PASSED** (8 active departments).
- `[Test 2] Department Existence Validation`: **PASSED** (Known department valid, unknown invalid).
- `[Test 3] Node.js -> Python FastAPI Service Communication`: **PASSED** (SBERT embedding & Top-K).
- `[Test 4] Graceful Failover on AI Service Outage`: **PASSED** (Returns null without crash).

### 3. Frontend Production Build:
- `npm run build`: **PASSED** (0 errors, built in 7.75s).
