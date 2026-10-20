ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS family_discount_claimed boolean NOT NULL DEFAULT false;
