-- Site where the person registered a shared event.
-- Null means the owner host. The mail brand reads this column.

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS entry_host_slug text;

COMMENT ON COLUMN public.event_attendees.entry_host_slug IS
  'Guest institute slug when the person registered on a shared event. Null means the owner host.';
