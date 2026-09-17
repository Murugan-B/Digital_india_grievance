# Digital India Public Grievance Portal — AI Semantic Routing Microservice

Internal Python FastAPI microservice responsible for automated semantic grievance triage and departmental ticket routing using Sentence Transformers (Sentence-BERT).

---

## Architecture & Integration Flow

```
React Frontend (Citizen Intake)
      ↓ (HTTP POST)
Node.js + Express API Layer (Port 5000)
      ↓ 1. Store grievance with department = NULL
      ↓ 2. Call internal AI service (Bearer AI_SERVICE_SECRET)
Python FastAPI AI Service (Port 8000)
      ├── 1. Generates SBERT embeddings for grievance text (Subject + Description)
      ├── 2. Computes cosine similarity against active departments in Supabase
      ├── 3. Sorts Top-K candidates & evaluates confidence threshold (0.65)
      └── 4. Returns predicted_department, confidence_score, and routing_status
      ↓
Node.js + Express
      ├── 1. Validates predicted department against active public.departments
      ├── 2. Writes unalterable audit log to public.grievance_ai_routings
      └── 3. If confidence >= 0.65: updates grievances.department = predicted_department
            If confidence < 0.65: leaves grievances.department = NULL (flagged for review)
```

---

## Technology Stack

- **Framework**: FastAPI (Asynchronous Python 3.11+)
- **Server**: Uvicorn ASGI
- **NLP / Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Vector Operations**: NumPy (Cosine Similarity on Normalized Embeddings)
- **Database Client**: `supabase-py` (fetches active departments from `public.departments`)

---

## Installation & Setup

```bash
# 1. Navigate to the AI service directory
cd ai-service

# 2. (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install required dependencies
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env

# 5. Start the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Environment Variables (`ai-service/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port for the AI microservice |
| `HOST` | `0.0.0.0` | Bind host |
| `AI_MODEL_NAME` | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model identifier |
| `AI_MODEL_VERSION` | `1.0` | Model version tag |
| `AI_CONFIDENCE_THRESHOLD` | `0.65` | Minimum cosine similarity required to auto-assign department |
| `TOP_K` | `3` | Number of ranked candidates returned |
| `AI_SERVICE_SECRET` | *(required)* | Shared secret for internal service-to-service authentication |
| `SUPABASE_URL` | *(required)* | Supabase Project URL |
| `SUPABASE_SECRET_KEY` | *(required)* | Supabase Secret API key |

---

## API Endpoints

### 1. Health Check (`GET /health`)
- **Auth Required**: No
- **Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "sentence-transformers/all-MiniLM-L6-v2",
  "departments_count": 8
}
```

### 2. Semantic Routing (`POST /api/v1/route`)
- **Auth Required**: `Authorization: Bearer <AI_SERVICE_SECRET>`
- **Request Body**:
```json
{
  "subject": "Frequent power cuts and sparks in residential transformer",
  "description": "Our area has experienced continuous power outages for the last 3 days..."
}
```
- **Response**:
```json
{
  "predicted_department": "Electricity",
  "confidence_score": 0.8842,
  "routing_status": "completed",
  "top_predictions": [
    {
      "department": "Electricity",
      "code": "POWER",
      "score": 0.8842
    },
    {
      "department": "Municipal Services",
      "code": "CIVIC",
      "score": 0.3812
    },
    {
      "department": "Roads & Transport",
      "code": "ROADS",
      "score": 0.2911
    }
  ],
  "model_name": "sentence-transformers/all-MiniLM-L6-v2",
  "model_version": "1.0"
}
```

---

## Security & Failure Resilience

1. **Internal Protection**: The endpoint is accessible strictly via `AI_SERVICE_SECRET`. Unauthorized requests return `401 Unauthorized`.
2. **Frontend Isolation**: The React frontend never connects to port 8000 directly.
3. **Resilient Failover**: If the Python service is unavailable or returns an error, the Node backend logs the failure safely and keeps the grievance stored with `department = NULL` without disrupting the citizen submission.
