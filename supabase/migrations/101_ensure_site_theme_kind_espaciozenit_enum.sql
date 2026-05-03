-- Guarantee `site_theme_kind` includes `espaciozenit`.
--
-- Greenfield installs: value is usually added in `099_site_theme_kind_espaciozenit.sql` first.
-- Legacy: if migration `099` was already applied under an older version that only added
-- `espaciozenith`, Postgres will NOT re-run 099 — this file fixes the enum without rewrites.
--
-- This file intentionally contains ONLY `ALTER TYPE … ADD VALUE` so it commits in its own
-- migration transaction before `102_*` casts to `espaciozenit`.

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
