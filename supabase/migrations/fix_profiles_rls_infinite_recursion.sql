-- ==============================================================================
-- FIX: PROFILES RLS INFINITE RECURSION & SECURE HELPER FUNCTIONS
-- ==============================================================================

-- 1. Helper function: Check if a user is an active administrator (SECURITY DEFINER to prevent RLS recursion)
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

-- 2. Helper function: Check if a user is an active official
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

-- 3. Helper function: Retrieve user assigned department safely
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

-- 4. Helper function: Retrieve user role safely
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

-- 5. Helper function: Retrieve user account status safely
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

-- Grant permissions to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.is_active_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_official(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_department(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_account_status(UUID) TO authenticated, service_role;


-- ==============================================================================
-- 6. RE-APPLY NON-RECURSIVE RLS POLICIES ON PUBLIC.PROFILES
-- ==============================================================================

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
-- 7. RE-APPLY NON-RECURSIVE RLS POLICIES ON DEPENDENT TABLES
-- ==============================================================================

-- Grievances Table Policies
DROP POLICY IF EXISTS "Officials can view department grievances" ON public.grievances;
CREATE POLICY "Officials can view department grievances"
    ON public.grievances
    FOR SELECT
    USING (
        public.is_active_official(auth.uid())
        AND department IS NOT NULL
        AND department = public.get_user_department(auth.uid())
    );

DROP POLICY IF EXISTS "Officials can update department grievances" ON public.grievances;
CREATE POLICY "Officials can update department grievances"
    ON public.grievances
    FOR UPDATE
    USING (
        public.is_active_official(auth.uid())
        AND department IS NOT NULL
        AND department = public.get_user_department(auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all grievances" ON public.grievances;
CREATE POLICY "Admins can view all grievances"
    ON public.grievances
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));


-- Grievance Status History Table Policies
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

DROP POLICY IF EXISTS "Admins can view all grievance history" ON public.grievance_status_history;
CREATE POLICY "Admins can view all grievance history"
    ON public.grievance_status_history
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));


-- Departments Table Policies
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments"
    ON public.departments
    FOR ALL
    USING (public.is_active_admin(auth.uid()));


-- AI Routings Table Policies
DROP POLICY IF EXISTS "Officials can view department grievance ai routing" ON public.grievance_ai_routings;
CREATE POLICY "Officials can view department grievance ai routing"
    ON public.grievance_ai_routings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_ai_routings.grievance_id
            AND public.is_active_official(auth.uid())
            AND grievances.department = public.get_user_department(auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins can view all grievance ai routing" ON public.grievance_ai_routings;
CREATE POLICY "Admins can view all grievance ai routing"
    ON public.grievance_ai_routings
    FOR SELECT
    USING (public.is_active_admin(auth.uid()));
