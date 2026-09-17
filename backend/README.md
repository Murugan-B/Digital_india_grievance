# Digital India Public Grievance Redressal Portal - Backend API

Production-structured Node.js + Express backend API layer connecting the React frontend with the Supabase PostgreSQL database.

## Architecture

```
React Frontend (Vite + Tailwind)
          ↓ (Bearer Token)
Node.js + Express API Layer (Port 5000)
  ├── Security: Helmet + CORS + Rate Limiting
  ├── Middleware: requireAuth + requireCitizen
  ├── Controllers: Input Validation & UUID Verification
  └── Services: Grievance Business Logic
          ↓ (SUPABASE_SECRET_KEY)
Supabase PostgreSQL Database & Row Level Security (RLS)
```

---

## Security Hardening (Phase 6)

1. **Helmet HTTP Headers**: Standardized security headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`).
2. **CORS Restrictions**: Explicit origin whitelist (`FRONTEND_URL`, `http://localhost:5173`, `http://localhost:5174`). Disallows `origin: "*"`.
3. **Rate Limiting**:
   - General API: `300 requests / 15 minutes / IP`.
   - Grievance Intake (`POST /api/grievances`): `40 submissions / 15 minutes / IP`.
4. **Body Size Limits**: JSON parsing restricted to `1MB` to prevent denial-of-service memory exhaustion.
5. **Authentication Hardening**:
   - Strict Bearer token extraction and validation via Supabase Auth server.
   - Database profile retrieval and active account verification.
   - Suspended accounts blocked with `403 Forbidden`.
6. **Role-Based Authorization**:
   - `requireCitizen` middleware guarantees only users with `role: "citizen"` and `account_status: "active"` can create or access citizen grievance data.
7. **Grievance Ownership Protection**:
   - All database queries strictly filter by the authenticated citizen ID (`req.user.id`).
   - Querying another user's grievance ID returns `404 Not Found` (never leaks existence).
   - Validates UUID v4 formatting with regex before executing database queries.
8. **Input Validation**:
   - `subject`: Required, 5 to 250 characters.
   - `description`: Required, 15 to 5000 characters. Supports regional Indian languages (Tamil, Hindi, etc.).
   - `preferred_language`: Whitelist validated against `['en', 'ta', 'hi', 'te', 'kn', 'ml']`.
   - Client overrides for `citizen_id`, `status`, `priority`, and `department` are ignored.
9. **Error Masking**: Database internals, stack traces, tokens, and secret keys are never exposed in API responses.

---

## Environment Configuration (`backend/.env`)

```env
PORT=5000
FRONTEND_URL=http://localhost:5173,http://localhost:5174
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

> [!WARNING]
> `SUPABASE_SECRET_KEY` is strictly for server-side use. Never expose it to client-side code, git repositories, or frontend `.env` files.

---

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

---

## Standard API Response Format

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Grievance submitted successfully.",
  "data": {
    "id": "1b08f877-e6f0-461b-968b-9e4ad70c0c53",
    "citizen_id": "...",
    "subject": "Water pipeline leakage on 5th cross street",
    "description": "...",
    "category": "Water Supply",
    "department": null,
    "location": "Ward 14, Chennai",
    "preferred_language": "ta",
    "status": "submitted",
    "priority": "normal",
    "created_at": "2026-09-15T16:00:00.000Z"
  }
}
```

### Error Response (`400`, `401`, `403`, `404`, `429`, `500`)
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

---

## API Endpoints

### Citizen Endpoints (`/api/grievances`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Server health check |
| `POST` | `/api/grievances` | Bearer (Citizen) | Submit a new public grievance |
| `GET` | `/api/grievances` | Bearer (Citizen) | List all grievances for authenticated citizen |
| `GET` | `/api/grievances/:id` | Bearer (Citizen) | Get details for an owned grievance by UUID |

### Official Endpoints (`/api/official/grievances`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/official/grievances` | Bearer (Official) | List grievances assigned to official's department |
| `GET` | `/api/official/grievances/stats` | Bearer (Official) | Get aggregated department statistics |
| `GET` | `/api/official/grievances/:id` | Bearer (Official) | Get department grievance detail & status history |
| `PATCH` | `/api/official/grievances/:id/status` | Bearer (Official) | Update status (`submitted` → `in_progress` → `resolved`/`rejected`) |
| `ALL` | `/api/*` | — | Fallback 404 JSON for undefined routes |

---

## Testing Guide

```bash
# 1. Test Health Check
curl http://localhost:5000/api/health

# 2. Test Missing Token Protection (Expect 401)
curl http://localhost:5000/api/grievances

# 3. Test Unknown API Route (Expect 404 JSON)
curl http://localhost:5000/api/unknown-endpoint
```
