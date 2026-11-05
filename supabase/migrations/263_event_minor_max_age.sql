-- Inclusive maximum age for the minor ticket. Null keeps the previous public sentence.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS minor_max_age SMALLINT NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_minor_max_age_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_minor_max_age_check
  CHECK (minor_max_age IS NULL OR (minor_max_age >= 1 AND minor_max_age <= 99));
