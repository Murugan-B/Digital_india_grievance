# Phase 9: Admin Dashboard & System Oversight

## Executive Summary
Phase 9 implements the **Central Administrative Oversight Directorate** for the **Digital India Multi-Lingual Public Grievance Redressal Portal**. The Admin Portal provides full system observability, user/official lifecycle management, department catalogue configuration, nation-wide grievance oversight, and human-in-the-loop AI semantic routing triage.

---

## 1. System Architecture & Access Control

```
+-------------------------------------------------------------------------------+
|                       React Admin Portal (/admin)                             |
|          (Protected by Client + Server Profile Role: admin & active)          |
+-------------------------------------------------------------------------------+
                                       |
                                       v HTTP (Supabase JWT Bearer Token)
+-------------------------------------------------------------------------------+
|                        Node.js + Express API Layer                            |
|             Middleware: requireAuth + requireAdmin (Role & Status)            |
+-------------------------------------------------------------------------------+
                                       |
     +---------------------------------+--------------------------------+
     |                                 |                                |
     v                                 v                                v
[User / Official Mgmt]      [Department Directory]           [Grievance Oversight]
- Approve / Deny Officials   - Add / Edit Scope               - Multifaceted Filters
- Suspend / Activate Users   - Deactivation Safety Check      - Unassigned Triage
- Paginated Search           - AI Compatibility Target        - Audit Timeline
                                                                |
                                                                v
                                                    [AI SBERT Routing Review]
                                                    - Cosine Similarity Audit
                                                    - Flagged-for-Review Queue
                                                    - Audited Manual Assignment
```

---

## 2. Admin Security & Authorization Model

1. **Server-Side Role Determination**:
   - Access to `/api/admin/*` is strictly guarded by `requireAuth` and `requireAdmin`.
   - The user's role is extracted from their verified database profile in `public.profiles` (`role === 'admin'` AND `account_status === 'active'`).
   - Unauthenticated requests receive `401 Unauthorized`.
   - Citizen, official, pending admin, or suspended accounts receive `403 Forbidden`.
2. **Anti-Privilege-Escalation**:
   - Administrators cannot modify their own role or account status via admin management endpoints.
   - Public registration cannot create active admin accounts.
3. **Database RLS**:
   - Supabase RLS remains fully enabled across all tables (`profiles`, `grievances`, `departments`, `grievance_status_history`, `grievance_ai_routings`).

---

## 3. Backend Admin API Surface

| Endpoint | Method | Middleware | Purpose |
|---|---|---|---|
| `/api/admin/stats` | `GET` | `requireAuth, requireAdmin` | Live counts of citizens, officials, grievances, unassigned tickets, and flagged AI routings |
| `/api/admin/users` | `GET` | `requireAuth, requireAdmin` | Server-side paginated user directory with search and role/status filters |
| `/api/admin/users/:id` | `GET` | `requireAuth, requireAdmin` | Individual user profile inspection |
| `/api/admin/users/:id/status` | `PATCH` | `requireAuth, requireAdmin` | Safely activate/suspend user accounts |
| `/api/admin/users/:id/verification` | `PATCH` | `requireAuth, requireAdmin` | Approve, reject, or suspend official registrations |
| `/api/admin/departments` | `GET` | `requireAuth, requireAdmin` | Master department catalogue with active grievance counts |
| `/api/admin/departments` | `POST` | `requireAuth, requireAdmin` | Register new department with unique name & code |
| `/api/admin/departments/:id` | `PATCH` | `requireAuth, requireAdmin` | Edit department scope or toggle active state with dependency warning check |
| `/api/admin/grievances` | `GET` | `requireAuth, requireAdmin` | Master grievance registry with status, priority, department, and date filters |
| `/api/admin/grievances/:id` | `GET` | `requireAuth, requireAdmin` | Full grievance dossier including citizen data, status history, and AI routing attempts |
| `/api/admin/grievances/:id/department` | `PATCH` | `requireAuth, requireAdmin` | Manual department assignment with `grievance_status_history` audit |
| `/api/admin/ai-routings` | `GET` | `requireAuth, requireAdmin` | Paginated Sentence-BERT AI classification history |
| `/api/admin/ai-routings/flagged` | `GET` | `requireAuth, requireAdmin` | Filtered queue for tickets with confidence $< 0.65$ |

---

## 4. Frontend Component Structure (`frontend/src/components/admin/`)

1. **`AdminHeader.jsx`**: National emblem branding, sync button, admin profile pill, mobile navigation toggle.
2. **`AdminSidebar.jsx`**: Navigation bar with real-time pending badges for Official Verifications, Flagged AI Routings, and Unassigned Tickets.
3. **`AdminOverview.jsx`**: Executive dashboard with metric cards and quick action alerts.
4. **`AdminOfficialVerification.jsx`**: Review queue for pending official registrations with confirmation dialogs.
5. **`AdminGrievanceManagement.jsx`**: Master grievance registry with faceted filters, search, and pagination.
6. **`AdminAIRoutingReview.jsx`**: SBERT AI classification auditor with similarity breakdown across Top-K candidates.
7. **`AdminDepartmentManagement.jsx`**: Department directory manager with deactivation safety confirmation.
8. **`AdminUserManagement.jsx`**: Master directory of citizens and officials with status toggles.
9. **`AdminGrievanceDetails.jsx`**: Comprehensive audit dossier modal.
10. **`AdminSecurityProfile.jsx`**: Administrator identity and security credentials view.
11. **`AdminStates.jsx`**: Modular Empty, Loading Skeleton, and Error states.

---

## 5. Verification Results

### Automated Test Suite (`backend/tests/verify_phase9_admin.js`):
- All **24 Test Cases Passed** (100% Success).
- Role Security: 401 on unauthenticated, 403 on citizen/official/pending/suspended admin.
- Real System Stats: Real live counts fetched without static placeholders.
- Official Verification: Approve/Reject/Suspend lifecycle validated.
- Department Management: Creation, listing, and dependency deactivation check validated.
- AI Review & Audited Manual Assignment: `grievance_status_history` logged, `grievance_ai_routings` preserved.
- Cross-Phase Continuity: Phase 1-8 APIs (Citizen, Official, AI Microservice) continue to operate with zero regressions.

### Frontend Production Build (`npm run build`):
- Built in 8.97s (1680 modules transformed, 0 errors).
