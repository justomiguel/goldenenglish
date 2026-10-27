BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seat_map_config JSONB NULL;

COMMENT ON COLUMN public.events.seat_map_config IS
  'Optional multi-floor 1000x1000 interactive seat map configuration (enabled, floors, blocks, hidden and reserved seats).';

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS seat_labels TEXT[] NULL;

COMMENT ON COLUMN public.event_attendees.seat_labels IS
  'Human-readable seat labels assigned to this registration when the event seat map is enabled.';

CREATE TABLE IF NOT EXISTS public.event_seat_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  seat_key TEXT NOT NULL,
  seat_label TEXT NOT NULL,
  attendee_id UUID NOT NULL REFERENCES public.event_attendees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_seat_locks_event_seat_unique UNIQUE (event_id, seat_key)
);

CREATE INDEX IF NOT EXISTS idx_event_seat_locks_attendee_id
  ON public.event_seat_locks (attendee_id);

CREATE INDEX IF NOT EXISTS idx_event_seat_locks_event_id
  ON public.event_seat_locks (event_id);

ALTER TABLE public.event_seat_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_seat_locks_modify_admin ON public.event_seat_locks;
CREATE POLICY event_seat_locks_modify_admin ON public.event_seat_locks
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMIT;
