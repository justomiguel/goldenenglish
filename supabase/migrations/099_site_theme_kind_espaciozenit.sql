-- Add espaciozenit to site_theme_kind. Seed rows live in 100_site_theme_espaciozenit_seed.sql.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'espaciozenit'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'espaciozenit';
  END IF;
END $$;
