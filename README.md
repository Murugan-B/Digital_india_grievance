# Digital India Aligned Multi-Lingual Public Grievance Redressal Portal with Automated Semantic Ticket Routing

An enterprise-grade, citizen-centric Public Grievance Redressal Portal aligned with the Government of India's Digital India mission. Features multilingual citizen support, automated AI semantic ticket routing powered by Sentence-BERT (SBERT), departmental official workflows, real-time notifications, central administrative oversight, and comprehensive system analytics.

---

## 1. Project Purpose
To provide Indian citizens with a transparent, accessible, and multilingual platform to voice civil grievances, while leveraging modern natural language processing and semantic similarity matching to automatically route grievances to the appropriate municipal and governmental departments with high accuracy and zero manual intervention delays.

---

## 2. Architecture Overview

```
[ Indian Citizen / Official / Admin ]
               │
               ▼
[ React 18 + Vite Frontend (Port 5173) ]
               │
               ▼ Bearer JWT
[ Node.js + Express API Gateway (Port 5000) ]
        │                             │
        │ Internal Secret             ▼ Service Role / RLS
        ▼                      [ Supabase PostgreSQL + Auth ]
[ Python FastAPI AI Service (Port 8000) ]
        │
        ▼
[ Sentence-BERT (all-MiniLM-L6-v2) Embeddings ]
```

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router v6.
- **Backend**: Node.js, Express.js, Helmet, CORS, Express Rate Limit, Supabase JS SDK.
- **AI Microservice**: Python 3.11+, FastAPI, Uvicorn, PyTorch, HuggingFace Sentence Transformers (`sentence-transformers/all-MiniLM-L6-v2`), Scikit-learn Cosine Similarity.
- **Database, Auth & Storage**: Supabase PostgreSQL 15, Row Level Security (RLS), Supabase Auth.

---

## 4. Key Features

- **Multilingual Citizen Interface**: Supports English, Hindi, Tamil, Telugu, Kannada, Malayalam.
- **Grievance Submission & Tracking**: Full citizen tracking with ticket IDs, status milestones, and department assignments.
- **Automated AI Semantic Routing**: Real-time vector embedding similarity matching against registered government departments.
- **Confidence Scoring & Flagged Queue**: High-confidence tickets ($\ge 0.65$) are automatically routed; ambiguous tickets are held for administrative review.
- **Departmental Official Workflow**: Filtered ticket feeds, status updates (`submitted` $\rightarrow$ `in_progress` $\rightarrow$ `resolved` / `rejected`), and audit notes.
- **Event-Driven Notifications**: Citizen and departmental alerts with 60-second duplicate suppression.
- **Administrative Oversight & Analytics**: High-level statistics, user verification, department directory, AI routing review, and live analytics charts.

---

## 5. Roles & Permissions (RBAC)

1. **Citizen (`citizen`)**:
   - Submit grievances and view personal submission history.
   - Receive notifications regarding status updates and department routing.
   - Update personal profile details (language preference, phone number).
2. **Departmental Official (`official`)**:
   - Access only tickets assigned strictly to their registered government department.
   - Perform valid status transitions (`submitted` $\rightarrow$ `in_progress` $\rightarrow$ `resolved` / `rejected`).
   - Add status change notes and internal remarks.
3. **Administrator (`admin`)**:
   - System-wide grievance oversight and manual department reassignments.
   - Review AI flagged tickets and audit classification scores.
   - User account status management (activation, suspension) and official verification.
   - Government department directory management.
   - Live analytics overview and trend monitoring.

---

## 6. Authentication & Authorization Security

- **JWT Verification**: Backend verifies Bearer tokens via Supabase Auth server.
- **Role Enforcement**: Multi-tier middleware (`requireAuth`, `requireCitizen`, `requireOfficial`, `requireAdmin`).
- **Strict Account Status**: `account_status = 'active'` is strictly required for official and administrator APIs. Pending or suspended accounts are rejected with HTTP 403.
- **Privilege Escalation Prevention**: Registration defaults to `role = 'citizen', account_status = 'pending'`. Direct profile modifications to `role` and `account_status` are forbidden.
- **Object-Level Authorization (IDOR Protection)**: Database queries strictly bind `citizen_id = req.user.id`, `department = req.profile.department`, and `recipient_id = req.user.id`.

---

## 7. Grievance Lifecycle

```
[ Citizen Submission ]
         │
         ▼
[ Status: submitted | Department: NULL ]
         │
         ▼
[ AI Semantic Routing ]
   ├── Confidence >= 0.65 ──► [ Department Assigned ] ──► [ Nodal Officer Review ]
   │                                                             │
   │                                                             ▼
   │                                                    [ Status: in_progress ]
   │                                                             │
   │                                           ┌─────────────────┴─────────────────┐
   │                                           ▼                                   ▼
   │                                 [ Status: resolved ]                [ Status: rejected ]
   │                                 (Terminal State)                    (Terminal State)
   │
   └── Confidence < 0.65  ──► [ Flagged for Review ]
                               (Admin Manual Assignment)
```

---

## 8. AI Semantic Ticket Routing

- **Model**: `sentence-transformers/all-MiniLM-L6-v2` loaded in-memory once at microservice startup.
- **Algorithm**: Cosine similarity between grievance text embedding $(E_{\text{subject}} + E_{\text{description}})$ and precomputed department semantic descriptions.
- **Validation**: Predicted department is verified against active records in `public.departments`.
- **Microservice Isolation**: Protected with `AI_SERVICE_SECRET` via Bearer authorization. The frontend never communicates directly with the AI service.

---

## 9. Notification System

- Types: `grievance_submitted`, `ai_routed`, `ai_review_required`, `status_changed`, `grievance_resolved`, `grievance_rejected`, `manual_assignment`.
- Non-blocking execution: Failure to dispatch a notification never aborts core grievance transactions.
- Deduplication: Prevents duplicate notification spam for identical ticket and event type within 60 seconds.

---

## 10. Database Schema & RLS Model

- **`public.profiles`**: User identities, roles, departments, account statuses. Secured via non-recursive `SECURITY DEFINER` helper functions (`is_active_admin`, `is_active_official`).
- **`public.grievances`**: Core grievance tickets with immutable citizen ownership bindings.
- **`public.departments`**: Registry of municipal and governmental departments.
- **`public.grievance_status_history`**: Audit trail of all state transitions and official notes.
- **`public.grievance_ai_routings`**: Immutable audit logs of all AI classification attempts, scores, and top-K predictions.
- **`public.notifications`**: User-scoped notifications with strict recipient isolation.

---

## 11. Environment Variables Configuration

### Backend (`backend/.env`)
```env
PORT=5000
FRONTEND_URL=http://localhost:5173,http://localhost:5174
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=your-internal-ai-service-secret
```

### AI Service (`ai-service/.env`)
```env
PORT=8000
HOST=0.0.0.0
AI_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
AI_MODEL_VERSION=1.0
AI_CONFIDENCE_THRESHOLD=0.65
TOP_K=3
AI_SERVICE_SECRET=your-internal-ai-service-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-publishable-key
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 12. Local Installation & Startup Guide

### Prerequisites
- Node.js 18+ / 20+
- Python 3.10+ / 3.11+
- Active Supabase Project

### Step 1: AI Microservice Setup
```bash
cd "ai-service"
python -m venv venv
.\venv\Scripts\activate       # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Step 2: Backend Setup
```bash
cd "backend"
npm install
node src/server.js
```

### Step 3: Frontend Setup
```bash
cd "frontend"
npm install
npm run dev
```

---

## 13. Automated Test Suites

```bash
# 1. Phase 11 Production Audit & Security Benchmarks
cd "backend" && node tests/verify_phase11_production.js

# 2. Authentication & Admin Security Hardening
cd "backend" && node tests/verify_auth_admin_security.js

# 3. Phase 10 Notifications & Analytics Suite
cd "backend" && node tests/verify_phase10.js

# 4. Phase 9 Admin Dashboard Oversight Suite
cd "backend" && node tests/verify_phase9_admin.js

# 5. AI Service Unit & Integration Tests
cd "ai-service" && .\venv\Scripts\python.exe -m pytest -v

# 6. Frontend Production Build
cd "frontend" && npm run build
```

---

## 14. Deployment & Production Considerations

- **CORS Configuration**: Set `FRONTEND_URL` in production to comma-separated production domains (e.g., `https://portal.gov.in`).
- **Process Management**: Run Node.js with PM2 or Docker; run FastAPI with Uvicorn / Gunicorn workers.
- **Health Probes**: Container orchestrators (Kubernetes / ECS) can query `GET /health` on both backend (port 5000) and AI service (port 8000).
- **Graceful Shutdown**: Node.js and FastAPI trap `SIGTERM` and `SIGINT` to cleanly close open connections.

---

## 15. Known Limitations

- **Offline / Edge AI**: The AI semantic routing relies on the in-memory Python microservice and requires ~500MB RAM for the PyTorch runtime.
- **Language Detection**: Regional Indian language grievances are processed using multilingual MiniLM vector representations; transliterated English (Hinglish/Tanglish) may have lower initial similarity scores and be safely flagged for review.
