-- ==============================================================================
-- DIGITAL INDIA MULTI-LINGUAL PUBLIC GRIEVANCE REDRESSAL PORTAL
-- Phase 8: Safe Database Migration & AI Semantic Routing Foundation
-- ==============================================================================
-- Purpose:
-- 1. Create normalized 'departments' catalog table with standard government categories.
-- 2. Add performance index on 'grievances.department' and 'grievances.priority'.
-- 3. Create 'grievance_ai_routings' audit and metadata table for SBERT predictions.
-- 4. Enable Row Level Security (RLS) with strict data isolation.
--
-- Safety Guarantees:
-- - Idempotent execution (safe to run multiple times).
-- - Zero data modification on existing profiles, grievances, or status records.
-- - No tables or columns are dropped.
-- - All new tables include automated updated_at triggers and foreign key cascades.
-- ==============================================================================

-- ==============================================================================
-- 1. DEPARTMENTS CATALOG TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.departments IS 'Standard government departments directory for official mapping and AI semantic routing targets';

-- Automatic updated_at trigger for departments
DROP TRIGGER IF EXISTS set_departments_updated_at ON public.departments;
CREATE TRIGGER set_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Department RLS: All authenticated users can view active departments
DROP POLICY IF EXISTS "Authenticated users can view active departments" ON public.departments;
CREATE POLICY "Authenticated users can view active departments"
    ON public.departments
    FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Department RLS: Administrators can manage departments
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments"
    ON public.departments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.account_status = 'active'
        )
    );

-- Seed recognized standard government departments (idempotent ON CONFLICT)
INSERT INTO public.departments (name, code, description)
VALUES
    ('Water Supply', 'WATER', 'Drinking water infrastructure, supply pipelines, distribution, and water quality issues'),
    ('Electricity', 'POWER', 'Electrical grid maintenance, power distribution, transformers, streetlights, and billing'),
    ('Roads & Transport', 'ROADS', 'Road repairs, highway maintenance, pothole fixing, traffic signaling, and public transit'),
    ('Sanitation', 'SAN', 'Waste management, garbage disposal, sewage line clearing, and municipal cleanliness'),
    ('Municipal Services', 'CIVIC', 'Trade licensing, birth/death certificates, property tax, and local civic administration'),
    ('Public Health', 'HEALTH', 'Government hospitals, primary health centers, immunization, and disease outbreak control'),
    ('Revenue', 'REV', 'Land records, patta transfers, property registrations, stamp duty, and revenue assessment'),
    ('Education', 'EDU', 'Government schools, infrastructure, mid-day meals, teacher availability, and scholarships')
ON CONFLICT (name) DO NOTHING;


-- ==============================================================================
-- 2. PERFORMANCE INDEXES ON GRIEVANCES TABLE
-- ==============================================================================
-- Optimizes official department triage queries and priority filtering
CREATE INDEX IF NOT EXISTS idx_grievances_department ON public.grievances(department);
CREATE INDEX IF NOT EXISTS idx_grievances_priority ON public.grievances(priority);
CREATE INDEX IF NOT EXISTS idx_grievances_unassigned ON public.grievances(created_at DESC) WHERE department IS NULL;


-- ==============================================================================
-- 3. AI SEMANTIC ROUTING AUDIT & PREDICTION TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.grievance_ai_routings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    predicted_department TEXT NOT NULL,
    confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0.0000 AND confidence_score <= 1.0000),
    routing_status TEXT NOT NULL DEFAULT 'completed' CHECK (routing_status IN ('pending', 'completed', 'flagged_for_review', 'failed')),
    model_name TEXT NOT NULL DEFAULT 'sentence-transformers/all-MiniLM-L6-v2',
    model_version TEXT NOT NULL DEFAULT '1.0',
    top_predictions JSONB DEFAULT '[]'::jsonb,
    routed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.grievance_ai_routings IS 'Audit log of automated Sentence-BERT semantic classifications and confidence scores';

CREATE INDEX IF NOT EXISTS idx_ai_routings_grievance_id ON public.grievance_ai_routings(grievance_id);
CREATE INDEX IF NOT EXISTS idx_ai_routings_status ON public.grievance_ai_routings(routing_status);
CREATE INDEX IF NOT EXISTS idx_ai_routings_routed_at ON public.grievance_ai_routings(routed_at DESC);

-- Enable RLS on grievance_ai_routings
ALTER TABLE public.grievance_ai_routings ENABLE ROW LEVEL SECURITY;

-- AI Routing RLS: Citizens can view routing details for their own grievances
DROP POLICY IF EXISTS "Citizens can view own grievance ai routing" ON public.grievance_ai_routings;
CREATE POLICY "Citizens can view own grievance ai routing"
    ON public.grievance_ai_routings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            WHERE grievances.id = grievance_ai_routings.grievance_id
            AND grievances.citizen_id = auth.uid()
        )
    );

-- AI Routing RLS: Officials can view AI routing for their department's grievances
DROP POLICY IF EXISTS "Officials can view department grievance ai routing" ON public.grievance_ai_routings;
CREATE POLICY "Officials can view department grievance ai routing"
    ON public.grievance_ai_routings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances
            JOIN public.profiles ON profiles.id = auth.uid()
            WHERE grievances.id = grievance_ai_routings.grievance_id
            AND profiles.role = 'official'
            AND profiles.account_status = 'active'
            AND profiles.department IS NOT NULL
            AND grievances.department = profiles.department
        )
    );

-- AI Routing RLS: Administrators can view all AI routings
DROP POLICY IF EXISTS "Admins can view all grievance ai routing" ON public.grievance_ai_routings;
CREATE POLICY "Admins can view all grievance ai routing"
    ON public.grievance_ai_routings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.account_status = 'active'
        )
    );
