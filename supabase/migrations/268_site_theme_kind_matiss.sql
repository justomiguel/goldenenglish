-- Exclusive theme for Matiss Studio (tenant slug `matiss`).
-- The enum value and the seed row live in separate files: Postgres rejects a
-- new enum value used in the same transaction that adds it. The seed is
-- 269_site_theme_matiss_row.sql and stays product SQL so shared schemas get it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'matiss'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'matiss';
  END IF;
END $$;
