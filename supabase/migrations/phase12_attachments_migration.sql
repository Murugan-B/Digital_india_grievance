-- ==============================================================================
-- PHASE 12 — GRIEVANCE ATTACHMENTS & EVIDENCE STORAGE MIGRATION (STANDALONE)
-- ==============================================================================

-- 1. Ensure security helper functions exist (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_active_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id
          AND role = 'admin'
          AND account_status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_official(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id
          AND role = 'official'
          AND account_status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT department
    FROM public.profiles
    WHERE id = user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_active_admin(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.is_active_official(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_user_department(UUID) TO authenticated, service_role, anon;

-- 2. Create table for grievance evidence image attachments
CREATE TABLE IF NOT EXISTS public.grievance_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_file_name TEXT,
    mime_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.grievance_attachments IS 'Evidence images and document attachments linked to citizen grievances';

-- 3. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_attachments_grievance_id ON public.grievance_attachments(grievance_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.grievance_attachments(uploaded_by);

-- 4. Enable Row Level Security
ALTER TABLE public.grievance_attachments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Citizens can view attachments for their own grievances
DROP POLICY IF EXISTS "Citizens can view own grievance attachments" ON public.grievance_attachments;
CREATE POLICY "Citizens can view own grievance attachments"
    ON public.grievance_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_attachments.grievance_id
            AND grievances.citizen_id = auth.uid()
        )
    );

-- 6. RLS Policy: Officials can view attachments for their department's grievances
DROP POLICY IF EXISTS "Officials can view department grievance attachments" ON public.grievance_attachments;
CREATE POLICY "Officials can view department grievance attachments"
    ON public.grievance_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_attachments.grievance_id
            AND public.is_active_official(auth.uid())
            AND grievances.department = public.get_user_department(auth.uid())
        )
    );

-- 7. RLS Policy: Admins can view all attachments
DROP POLICY IF EXISTS "Admins can view all grievance attachments" ON public.grievance_attachments;
CREATE POLICY "Admins can view all grievance attachments"
    ON public.grievance_attachments
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));

-- 8. RLS Policy: Citizens can insert attachments for their own grievances
DROP POLICY IF EXISTS "Citizens can insert own grievance attachments" ON public.grievance_attachments;
CREATE POLICY "Citizens can insert own grievance attachments"
    ON public.grievance_attachments
    FOR INSERT
    WITH CHECK (
        auth.uid() = uploaded_by
        AND EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_attachments.grievance_id
            AND grievances.citizen_id = auth.uid()
        )
    );
