-- Generic institute landing kinds. Seed rows live in 233.
-- Postgres cannot use a new enum label in the same transaction (55P04).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'deportes'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'deportes';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'jardin'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'jardin';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'colegio'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'colegio';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'musica'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'musica';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'idiomas'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'idiomas';
  END IF;
END $$;
