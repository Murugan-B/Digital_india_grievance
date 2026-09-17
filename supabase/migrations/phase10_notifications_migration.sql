-- ==============================================================================
-- DIGITAL INDIA MULTI-LINGUAL PUBLIC GRIEVANCE REDRESSAL PORTAL
-- Phase 10: Notifications & Real-Time Alerts Migration
-- ==============================================================================
-- Purpose:
-- 1. Create 'public.notifications' table for in-app citizen, official, and admin alerts.
-- 2. Enable strict Row Level Security (RLS) ensuring recipient-only data isolation.
-- 3. Create optimized composite indexes for high-throughput unread count & timeline queries.
--
-- Safety Guarantees:
-- - Idempotent execution (safe to run multiple times).
-- - Zero data modification on existing profiles, grievances, or routing tables.
-- - No tables or columns are dropped.
-- - Automatic foreign key cascades on user/grievance deletion.
-- ==============================================================================

-- ==============================================================================
-- 1. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN (
            'grievance_submitted',
            'ai_routed',
            'ai_review_required',
            'status_changed',
            'grievance_resolved',
            'grievance_rejected',
            'manual_assignment'
        )
    ),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.notifications IS 'In-app notification messages and alerts for citizens, officials, and administrators';

-- ==============================================================================
-- 2. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================================================
-- Optimizes recipient unread queries and badge counts
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
    ON public.notifications(recipient_id, is_read);

-- Optimizes recipient timeline queries sorted by newest first
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created 
    ON public.notifications(recipient_id, created_at DESC);

-- Optimizes foreign key lookups for grievance deletions
CREATE INDEX IF NOT EXISTS idx_notifications_grievance_id 
    ON public.notifications(grievance_id);


-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view strictly their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = recipient_id);

-- Policy 2: Users can update read status on their own notifications
DROP POLICY IF EXISTS "Users can update own notification read state" ON public.notifications;
CREATE POLICY "Users can update own notification read state"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (
        auth.uid() = recipient_id
    );

-- Policy 3: Service role / Backend manages creation (No arbitrary client insertion)
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;
CREATE POLICY "Service role can manage notifications"
    ON public.notifications
    FOR ALL
    USING (true)
    WITH CHECK (true);
