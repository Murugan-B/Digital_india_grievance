# Phase 10 — In-App Notifications & Central System Analytics

## 1. Overview & Architectural Principles

Phase 10 introduces two central enterprise capabilities to the **Digital India Multi-Lingual Public Grievance Redressal Portal**:
1. **Persistent Multi-Tenant In-App Notifications**: Real-time notification tracking for Citizens, Departmental Officials, and Administrators upon key grievance lifecycle events (submission, AI Semantic routing, departmental review requirement, status transitions, manual reassignments).
2. **Central Administrative Analytics & AI Telemetry**: Live metric aggregation derived directly from PostgreSQL grievance tables, Sentence-BERT AI routing logs, and historical status transition events without relying on hardcoded values.

### Core Architectural Invariants:
- **Strict Tiering**: `React Frontend` $\rightarrow$ `Node.js + Express API Layer` $\rightarrow$ `Supabase PostgreSQL`.
- **Fail-Safe Principle**: Notification creation errors or latency must never abort or roll back primary grievance operations (e.g. ticket submission, AI routing, or status updates).
- **Strict Tenant Isolation**: Notifications are strictly scoped to `recipient_id = auth.uid()` via database Row Level Security and server-side authorization.
- **Accurate Analytics Derivation**: All calculations use verified database records (e.g., resolution time is calculated strictly from `grievance_status_history` timestamp differences, not approximate `updated_at` timestamps).

---

## 2. Database Design & Migration

Migration File: `supabase/migrations/phase10_notifications_migration.sql`

```sql
-- Phase 10: In-App Notifications Schema
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    grievance_id UUID NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'grievance_submitted',
        'ai_routed',
        'ai_review_required',
        'status_changed',
        'grievance_resolved',
        'grievance_rejected',
        'manual_assignment'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted Composite Indexes for Fast Recipient Queries & Filtering
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON public.notifications(recipient_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created 
ON public.notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_grievance_id 
ON public.notifications(grievance_id);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

---

## 3. Row Level Security (RLS) Model

| Operation | Target Role | RLS Policy Condition | Enforcement Description |
| :--- | :--- | :--- | :--- |
| **SELECT** | Authenticated User | `recipient_id = auth.uid()` | Citizens, Officials, and Admins can only view notifications where they are the explicit recipient. |
| **UPDATE** | Authenticated User | `recipient_id = auth.uid()` | Users can only mark their own notifications as read (`is_read = true`). |
| **INSERT** | Service Role Only | `auth.role() = 'service_role'` | Clients cannot inject arbitrary system notifications. All notifications are created by backend business logic. |
| **DELETE** | Service Role Only | `auth.role() = 'service_role'` | Notifications cannot be deleted by arbitrary frontend requests. |

---

## 4. Controlled Notification Vocabulary

| Notification Type | Trigger Event | Primary Recipient | Example Notification Message |
| :--- | :--- | :--- | :--- |
| `grievance_submitted` | Grievance recorded | Citizen | *"Your grievance 'Water leakage in Ward 4' has been recorded and queued for AI departmental routing."* |
| `ai_routed` | High-confidence AI match ($\ge 0.65$) | Citizen + Department Officials | *"Your grievance has been automatically assigned to the Water Supply and Sanitation department (88% confidence match)."* / *"A new grievance has been routed to your department."* |
| `ai_review_required` | Low-confidence AI match ($< 0.65$) | Citizen | *"Your grievance has been flagged for administrative review and will be manually routed."* |
| `status_changed` | Official transitions status to `in_progress` | Citizen | *"Your grievance is now actively being processed by the assigned nodal officer."* |
| `grievance_resolved` | Official transitions status to `resolved` | Citizen | *"Your grievance has been successfully resolved."* |
| `grievance_rejected` | Official transitions status to `rejected` | Citizen | *"Your grievance was reviewed and closed with status: Rejected."* |
| `manual_assignment` | Admin manually assigns department | Citizen + Target Officials | *"Your grievance has been assigned to the Electricity Department by central administration."* |

---

## 5. Automated Notification Event Dispatch Rules

1. **Duplicate Prevention**: A 60-second duplicate suppression window is enforced on matching `(recipient_id, grievance_id, type)` to prevent notification spam during rapid UI clicks or network retries.
2. **AI Semantic Routing Safety**: If the Python FastAPI Sentence-BERT service returns a valid department and confidence $\ge 0.65$, both the citizen and active department officials receive `ai_routed` notifications. If confidence is below threshold, a review notice (`ai_review_required`) is created without falsely indicating department assignment.
3. **Fail-Safe Execution**: In `grievanceController.js`, `aiRoutingService.js`, and `officialService.js`, notification dispatches are wrapped in non-blocking try-catch blocks to prevent notification failures from impeding primary transactional flows.

---

## 6. Backend API Endpoints

### Notification Endpoints (`/api/notifications`)
- `GET /api/notifications`: Retrieves paginated notifications for the authenticated user (`?page=1&limit=20&unread_only=false`).
- `GET /api/notifications/unread-count`: Returns the integer count of unread notifications for badge rendering.
- `PATCH /api/notifications/:id/read`: Marks a specific notification as read (scoped strictly to `auth.uid()`).
- `PATCH /api/notifications/read-all`: Marks all unread notifications for the authenticated user as read.

### Analytics Endpoints (`/api/admin/analytics`)
- `GET /api/admin/analytics/overview?days=30`: Admin-only endpoint returning master metrics, priority breakdowns, department load rankings, AI accuracy metrics, resolution time averages, and daily inflow/resolution trends.

---

## 7. Analytics Formulas & Definitions

1. **Total Grievances**: $\text{COUNT}(*)$ from `public.grievances`.
2. **Unassigned Grievances**: Grievances where `department IS NULL`.
3. **Status Distribution**: $\text{COUNT}(*)$ grouped strictly by `grievances.status` (`submitted`, `in_progress`, `resolved`, `rejected`).
4. **Priority Distribution**: $\text{COUNT}(*)$ grouped by `grievances.priority` (`low`, `normal`, `high`, `urgent`).
5. **AI Routing Completion Rate**:
   $$\text{Completion Rate} = \left( \frac{\text{Completed AI Routings}}{\text{Total AI Routing Attempts}} \right) \times 100$$
6. **Mean AI Model Confidence**:
   $$\overline{\text{Confidence}} = \frac{\sum \text{confidence\_score}}{\text{Total AI Routing Attempts}}$$
7. **Average Resolution Time**:
   $$\text{Avg Resolution Time} = \frac{1}{N} \sum_{i=1}^{N} \left( \text{changed\_at}_{\text{resolved}} - \text{created\_at}_{\text{grievance}} \right)$$
   *Note*: Derived directly by joining `grievance_status_history` where `new_status = 'resolved'` with `grievances.created_at`. If no grievances have been resolved, returns `null` rather than an artificial estimate.

---

## 8. Frontend Components & User Experience

1. **Universal NotificationBell (`NotificationBell.jsx`)**:
   - Live unread notification counter badge with pulse animation.
   - Dropdown with categorized icons (Sparkles for AI, CheckCircle for Resolved, UserCheck for Manual Assignment, Clock for In Progress).
   - Relative time formatting ("Just now", "5m ago", "2h ago", "Yesterday").
   - Individual "Mark as Read" action and header "Mark all read" button.
   - Seamlessly integrated into `AdminHeader`, `CitizenHeader`, and `OfficialHeader`.
2. **Admin Analytics Dashboard (`AdminAnalytics.jsx`)**:
   - Time window selector (7D, 14D, 30D, 90D).
   - High-level metric cards for Total Inflow, AI Accuracy, Avg Resolution Time, and Resolution Rate.
   - Status & Priority distribution progress bars with live percentages.
   - Sentence-BERT routing intelligence card displaying auto-routed vs flagged count and mean cosine similarity.
   - Responsive bar chart visualizing daily grievance influx versus resolutions over time.

---

## 9. Verification & Test Results

The comprehensive test suite (`backend/tests/verify_phase10.js`) was executed against the running application:

```
======================================================================
TOTAL TESTS: 31 | PASSED: 31 | FAILED: 0
======================================================================
```

- **Security & Authorization**: Unauthenticated (401) and unauthorized role requests (403) verified across notification and analytics endpoints.
- **Recipient Isolation**: Verified that citizens, officials, and admins can only view and update their own notifications.
- **Automated Notification Generation**: Verified submission, AI routing, AI review, and status change triggers.
- **Analytics Data Precision**: Database aggregation verified against live PostgreSQL counts for status, priority, departments, AI audits, and resolution durations.
- **Regression**: Citizen grievance retrieval, official departmental queue, admin system stats, and AI semantic ticket routing confirmed 100% operational.
- **Production Build**: `npm run build` completed with 0 errors.

---

## 10. Known Limitations & Phase 11 Roadmap

- **Push / External Delivery Channels**: Phase 10 implements in-app notification storage and UI rendering. External SMS, Email (Gov SMTP), and WhatsApp gateways are reserved for future phases.
- **Real-Time WebSockets**: Notifications currently use a 30-second background polling cycle with instant refresh on popover interaction; Supabase Realtime WebSocket subscriptions can be added in Phase 11 for sub-second push updates.
