-- Minor tickets use one differentiated price. Age is checked at the event.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allow_minor_tickets BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS minor_ticket_price NUMERIC(12, 2) NULL;

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS minor_ticket_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.event_attendees
  DROP CONSTRAINT IF EXISTS event_attendees_minor_ticket_count_check;

ALTER TABLE public.event_attendees
  ADD CONSTRAINT event_attendees_minor_ticket_count_check
  CHECK (minor_ticket_count >= 0);
