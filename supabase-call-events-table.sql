-- ============================================================
-- Supabase Table: call_events
-- Purpose: Real-time signaling for VoIP calls
-- Uses: Supabase Realtime for instant event propagation
-- ============================================================

-- Create the call_events table
CREATE TABLE IF NOT EXISTS public.call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    caller_id TEXT NOT NULL,
    callee_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'call_started',
        'ringing',
        'accepted',
        'rejected',
        'ended',
        'missed'
    )),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Indexes for performance
    CONSTRAINT call_events_pkey PRIMARY KEY (id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_call_events_tenant ON public.call_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_events_caller ON public.call_events(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_events_callee ON public.call_events(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_events_room ON public.call_events(room_name);
CREATE INDEX IF NOT EXISTS idx_call_events_created ON public.call_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_events_type ON public.call_events(event_type);

-- Composite index for filtering by tenant and user
CREATE INDEX IF NOT EXISTS idx_call_events_tenant_users ON public.call_events(tenant_id, callee_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see events for their tenant
CREATE POLICY "Users can view call events for their tenant"
ON public.call_events
FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.users WHERE supabase_user_id = auth.uid()
    )
);

-- Policy: Users can insert call events for their tenant
CREATE POLICY "Users can insert call events for their tenant"
ON public.call_events
FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.users WHERE supabase_user_id = auth.uid()
    )
);

-- Policy: Users can update their own call events
CREATE POLICY "Users can update their own call events"
ON public.call_events
FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.users WHERE supabase_user_id = auth.uid()
    )
);

-- Enable Supabase Realtime
-- This allows real-time subscriptions to INSERT, UPDATE, DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_events;

-- Create a function to clean up old call events (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_call_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.call_events
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Optional: Create a scheduled job to run cleanup daily
-- (Requires pg_cron extension - enable in Supabase dashboard if needed)
-- SELECT cron.schedule(
--     'cleanup-old-call-events',
--     '0 2 * * *', -- Run at 2 AM daily
--     'SELECT public.cleanup_old_call_events();'
-- );

-- Grant necessary permissions
GRANT ALL ON public.call_events TO authenticated;
GRANT ALL ON public.call_events TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.call_events IS 'Real-time call signaling events for VoIP using Supabase Realtime';
COMMENT ON COLUMN public.call_events.event_type IS 'Call event types: call_started, ringing, accepted, rejected, ended, missed';
COMMENT ON COLUMN public.call_events.payload IS 'Additional event metadata (caller name, tokens, etc.)';

-- ============================================================
-- USAGE INSTRUCTIONS:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify table appears in Table Editor
-- 3. Go to Database > Replication > Enable for call_events
-- 4. Backend will insert events, Realtime will propagate instantly
-- ============================================================
