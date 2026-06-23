-- Optional birth date on public event registration (off by default).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS collect_birth_date BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.collect_birth_date IS
  'When true, public registration shows birth date and may require tutor data for minors. When false, birth_date is stored as NULL.';
