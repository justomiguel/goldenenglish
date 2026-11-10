-- One grant lets a guest institute show and manage one owner event.
-- Open rows are pending, approved, and pending_unshare.
-- The Pulsar service role writes these rows. There is no anon or authenticated policy.

CREATE TABLE IF NOT EXISTS public.event_share_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_slug text NOT NULL,
  owner_event_id uuid NOT NULL,
  guest_slug text NOT NULL,
  status text NOT NULL,
  requested_by uuid NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_share_grants_status_check CHECK (
    status IN ('pending', 'approved', 'pending_unshare', 'rejected', 'closed')
  ),
  CONSTRAINT event_share_grants_distinct_sites CHECK (owner_slug <> guest_slug)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_share_grants_open_guest
  ON public.event_share_grants (owner_slug, owner_event_id, guest_slug)
  WHERE status IN ('pending', 'approved', 'pending_unshare');

CREATE INDEX IF NOT EXISTS event_share_grants_guest_approved_idx
  ON public.event_share_grants (guest_slug, owner_event_id)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS event_share_grants_pending_idx
  ON public.event_share_grants (created_at)
  WHERE status IN ('pending', 'pending_unshare');

ALTER TABLE public.event_share_grants ENABLE ROW LEVEL SECURITY;
