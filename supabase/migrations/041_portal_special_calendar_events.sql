-- Institute-wide special calendar events (holidays, assemblies) visible to all authenticated users; admin CRUD.

CREATE TABLE IF NOT EXISTS public.portal_special_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_special_calendar_events_time_chk CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS portal_special_calendar_events_starts_idx
  ON public.portal_special_calendar_events (starts_at ASC);

COMMENT ON TABLE public.portal_special_calendar_events IS
  'School-wide calendar rows (special / non-class) shown in portal calendars and iCal feeds.';

DROP TRIGGER IF EXISTS portal_special_calendar_events_set_updated_at ON public.portal_special_calendar_events;
CREATE TRIGGER portal_special_calendar_events_set_updated_at
  BEFORE UPDATE ON public.portal_special_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.portal_special_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_special_calendar_events_select_auth ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_select_auth
  ON public.portal_special_calendar_events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS portal_special_calendar_events_insert_admin ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_insert_admin
  ON public.portal_special_calendar_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_special_calendar_events_update_admin ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_update_admin
  ON public.portal_special_calendar_events FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_special_calendar_events_delete_admin ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_delete_admin
  ON public.portal_special_calendar_events FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
