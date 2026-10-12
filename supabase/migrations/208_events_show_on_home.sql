-- Opt-in home dialog. Public eligibility stays in the app query:
-- published, not archived, not section-private, and still upcoming.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.show_on_home IS
  'When true, a published public upcoming event may appear in the home popup.';

CREATE INDEX IF NOT EXISTS events_show_on_home_upcoming_idx
  ON public.events (event_date)
  WHERE show_on_home = true
    AND status = 'published'
    AND archived_at IS NULL
    AND private_to_section = false;
