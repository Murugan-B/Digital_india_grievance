-- ==============================================================================
-- DIGITAL INDIA MULTI-LINGUAL PUBLIC GRIEVANCE REDRESSAL PORTAL
-- Complete Database Schema (Phase 3 + Phase 5)
-- ==============================================================================

-- ==============================================================================
-- 1. PROFILES TABLE (Phase 3)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile_number TEXT,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'official', 'admin')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'pending', 'suspended')),
    preferred_language TEXT DEFAULT 'en',
    department TEXT,
    designation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'Citizen, Government Official, and Administrator profiles linked to Supabase Auth';

-- 2. Automatic updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Trigger Function: Automatically create profile upon user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    req_role TEXT;
    init_status TEXT;
BEGIN
    req_role := COALESCE(NEW.raw_user_meta_data->>'role', 'citizen');
    
    IF req_role = 'admin' THEN
        req_role := 'citizen';
        init_status := 'pending';
    ELSIF req_role = 'official' THEN
        init_status := 'pending';
    ELSE
        req_role := 'citizen';
        init_status := 'active';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        mobile_number,
        role,
        account_status,
        preferred_language,
        department,
        designation
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Citizen User'),
        NEW.email,
        NEW.raw_user_meta_data->>'mobile_number',
        req_role,
        init_status,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'designation'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security Definer Helper Functions to eliminate RLS recursion
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

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_account_status(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT account_status
    FROM public.profiles
    WHERE id = user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_active_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_official(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_department(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_account_status(UUID) TO authenticated, service_role;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile personal info" ON public.profiles;
CREATE POLICY "Users can update own profile personal info"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = public.get_user_role(auth.uid())
        AND account_status = public.get_user_account_status(auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update verification status" ON public.profiles;
CREATE POLICY "Admins can update verification status"
    ON public.profiles
    FOR UPDATE
    USING (public.is_active_admin(auth.uid()))
    WITH CHECK (public.is_active_admin(auth.uid()));

-- ==============================================================================
-- 4. GRIEVANCES TABLE (Phase 5)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    department TEXT DEFAULT NULL,
    location TEXT,
    preferred_language TEXT DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_progress', 'resolved', 'rejected')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.grievances IS 'Public grievances submitted by registered citizens for departmental redressal';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_grievances_citizen_id ON public.grievances(citizen_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_created_at ON public.grievances(created_at DESC);

-- Automatic updated_at trigger for grievances
DROP TRIGGER IF EXISTS set_grievances_updated_at ON public.grievances;
CREATE TRIGGER set_grievances_updated_at
    BEFORE UPDATE ON public.grievances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on grievances
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

-- Grievances RLS Policies

-- Policy 1: Citizens can view only their own grievances
DROP POLICY IF EXISTS "Citizens can view own grievances" ON public.grievances;
CREATE POLICY "Citizens can view own grievances"
    ON public.grievances
    FOR SELECT
    USING (auth.uid() = citizen_id);

-- Policy 2: Active Officials can view grievances assigned strictly to their own department
DROP POLICY IF EXISTS "Officials can view department grievances" ON public.grievances;
CREATE POLICY "Officials can view department grievances"
    ON public.grievances
    FOR SELECT
    USING (
        public.is_active_official(auth.uid())
        AND department IS NOT NULL
        AND department = public.get_user_department(auth.uid())
    );

-- Policy 3: Active Officials can update grievance status for their own department
DROP POLICY IF EXISTS "Officials can update department grievances" ON public.grievances;
CREATE POLICY "Officials can update department grievances"
    ON public.grievances
    FOR UPDATE
    USING (
        public.is_active_official(auth.uid())
        AND department IS NOT NULL
        AND department = public.get_user_department(auth.uid())
    );

-- Policy 4: Active Administrators can view all grievances
DROP POLICY IF EXISTS "Admins can view all grievances" ON public.grievances;
CREATE POLICY "Admins can view all grievances"
    ON public.grievances
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));

-- ==============================================================================
-- 5. GRIEVANCE STATUS HISTORY TABLE (Phase 7)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.grievance_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    notes TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.grievance_status_history IS 'Audit log of departmental grievance status transitions';

CREATE INDEX IF NOT EXISTS idx_status_history_grievance_id ON public.grievance_status_history(grievance_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON public.grievance_status_history(changed_at DESC);

-- Enable RLS on grievance_status_history
ALTER TABLE public.grievance_status_history ENABLE ROW LEVEL SECURITY;

-- History RLS: Citizens can view history of their own grievances
DROP POLICY IF EXISTS "Citizens can view own grievance history" ON public.grievance_status_history;
CREATE POLICY "Citizens can view own grievance history"
    ON public.grievance_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_status_history.grievance_id
            AND grievances.citizen_id = auth.uid()
        )
    );

-- History RLS: Officials can view history for their department's grievances
DROP POLICY IF EXISTS "Officials can view department grievance history" ON public.grievance_status_history;
CREATE POLICY "Officials can view department grievance history"
    ON public.grievance_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_status_history.grievance_id
            AND public.is_active_official(auth.uid())
            AND grievances.department = public.get_user_department(auth.uid())
        )
    );

-- History RLS: Admins can view all history
DROP POLICY IF EXISTS "Admins can view all grievance history" ON public.grievance_status_history;
CREATE POLICY "Admins can view all grievance history"
    ON public.grievance_status_history
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));

-- ==============================================================================
-- 6. GRIEVANCE ATTACHMENTS TABLE (Phase 12)
-- ==============================================================================
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

CREATE INDEX IF NOT EXISTS idx_attachments_grievance_id ON public.grievance_attachments(grievance_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.grievance_attachments(uploaded_by);

ALTER TABLE public.grievance_attachments ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Admins can view all grievance attachments" ON public.grievance_attachments;
CREATE POLICY "Admins can view all grievance attachments"
    ON public.grievance_attachments
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));

