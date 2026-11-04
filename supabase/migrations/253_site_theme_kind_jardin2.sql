-- Second early-years template. Seed row lives in 254.
-- Postgres cannot use a new enum label in the same transaction (55P04).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'jardin2'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'jardin2';
  END IF;
END $$;
