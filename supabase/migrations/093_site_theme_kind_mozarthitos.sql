-- Add Mozarthitos to site_theme_kind. Cannot INSERT using this label in the
-- same transaction (PG 55P04). Seed rows live in 094_site_theme_mozarthitos_seed.sql.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'mozarthitos'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'mozarthitos';
  END IF;
END $$;

UPDATE public.site_themes
SET name = 'Golden'
WHERE slug = 'default' AND is_system_default = TRUE;
