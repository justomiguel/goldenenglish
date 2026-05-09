-- Guarantee `site_theme_kind` includes `nago`.
-- Idempotent: skips if label already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'nago'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'nago';
  END IF;
END $$;
