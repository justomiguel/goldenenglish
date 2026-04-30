-- Staff mutation audit trail. Product usage analytics remains in user_events.

DO $$
BEGIN
  CREATE TYPE public.audit_event_domain AS ENUM (
    'academic',
    'sections',
    'finance',
    'identity',
    'communications',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  actor_role TEXT,
  domain public.audit_event_domain NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  summary TEXT NOT NULL DEFAULT '',
  before_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_created_idx
  ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_created_idx
  ON public.audit_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_domain_created_idx
  ON public.audit_events (domain, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_resource_created_idx
  ON public.audit_events (resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_action_created_idx
  ON public.audit_events (action, created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_events_admin_select ON public.audit_events;
CREATE POLICY audit_events_admin_select ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Inserts are performed by trusted server actions. Regular authenticated
-- clients can read as admins but cannot append arbitrary audit rows.
