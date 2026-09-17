# Phase 8 Database Migration Notes: Safe AI Semantic Routing Foundation

## 1. Executive Summary & Current Schema State

Treating [supabase/schema.sql](file:///d:/Digital%20India/supabase/schema.sql) as the single source of truth, the database currently comprises:

1. **`public.profiles`**: Citizen, official, and admin accounts linked 1-to-1 with `auth.users(id)` with auto-provisioning triggers and RLS self-update restrictions.
2. **`public.grievances`**: Citizen-submitted grievance intake records with enforced statuses (`submitted`, `in_progress`, `resolved`, `rejected`), priorities (`low`, `normal`, `high`, `urgent`), and strict citizen/department RLS policies.
3. **`public.grievance_status_history`**: Audit trail recording nodal officer status transitions.

---

## 2. Identified Gaps & Why New Structures Are Required

### A. Missing Department Query Performance Indexes
- **Problem**: Officials and RLS policies filter heavily on `grievances.department` (e.g., `WHERE department = 'Electricity'`). Currently, no index exists on `grievances.department`, leading to full sequential table scans as ticket volume scales.
- **Solution**: Add `idx_grievances_department` and `idx_grievances_unassigned` (partial index for `WHERE department IS NULL`).

### B. Department Catalogue Normalization (`public.departments`)
- **Problem**: Departments are currently unconstrained strings in `profiles` and `grievances`.
- **Solution**: A normalized `departments` table provides a standardized authority for the 8 recognized public service departments (`Water Supply`, `Electricity`, `Roads & Transport`, `Sanitation`, `Municipal Services`, `Public Health`, `Revenue`, `Education`), allowing official registration validation and AI classification targets.

### C. AI Semantic Routing Audit & Confidence Log (`public.grievance_ai_routings`)
- **Problem**: When the Sentence-BERT AI routing microservice in Phase 8 processes unassigned tickets (`department IS NULL`), it requires a structured location to store:
  - The predicted department
  - The mathematical confidence score (0.0000 to 1.0000)
  - Top candidate predictions (stored safely as JSONB)
  - The AI model identifier and version (`sentence-transformers/all-MiniLM-L6-v2`)
  - Timestamp of automated routing
- **Solution**: Storing this in a dedicated `grievance_ai_routings` table avoids polluting the primary `grievances` table with transient ML execution metadata and maintains an unalterable AI audit trail.

---

## 3. Security & Row Level Security (RLS) Analysis

All new tables are locked down with Row Level Security:
- **`public.departments`**:
  - `SELECT`: All authenticated users can read active departments.
  - `INSERT/UPDATE/DELETE`: Restricted strictly to verified active Administrators.
- **`public.grievance_ai_routings`**:
  - `SELECT (Citizens)`: Citizens can view AI classification metadata only for grievances they own (`grievances.citizen_id = auth.uid()`).
  - `SELECT (Officials)`: Officials can view AI classification metadata only for grievances assigned to their own verified department.
  - `SELECT (Admins)`: Admins can inspect all AI routing logs.

---

## 4. Safety & Idempotency Guarantees

- **No Destructive Operations**: No `DROP TABLE`, `DROP COLUMN`, or datatype mutations.
- **No Data Mutation**: Existing profiles, grievances, and status history rows remain untouched. Unassigned grievances retain `department = NULL`.
- **Safe Reruns**: Uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, and `DROP POLICY IF EXISTS ... CREATE POLICY`.

---

## 5. Rollback Considerations

If needed, the migration can be safely reverted without affecting Phase 1–7 citizen or official operations:
```sql
DROP TABLE IF EXISTS public.grievance_ai_routings CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP INDEX IF EXISTS public.idx_grievances_department;
DROP INDEX IF EXISTS public.idx_grievances_priority;
DROP INDEX IF EXISTS public.idx_grievances_unassigned;
```

---

## 6. How to Execute Manually in Supabase Dashboard

1. Open your browser and navigate to the **Supabase Dashboard**:  
   `https://supabase.com/dashboard/project/fadnelkafxupsptffhik`
2. In the left-hand sidebar, click on **SQL Editor**.
3. Click **New Query**.
4. Copy the entire contents of [supabase/migrations/phase8_database_migration.sql](file:///d:/Digital%20India/supabase/migrations/phase8_database_migration.sql).
5. Paste the SQL into the editor and click **Run** (or press `Ctrl + Enter`).
6. Confirm the execution succeeds with `Success. No rows returned`.
