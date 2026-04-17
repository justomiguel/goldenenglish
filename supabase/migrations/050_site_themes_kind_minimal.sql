-- Extend site_theme_kind enum with 'minimal' so admins can switch the public
-- landing to a third visual personality without manual SQL.
--
-- IMPORTANTE: Postgres no permite usar un nuevo valor de enum en la misma
-- transacción donde se añade ("New enum values must be committed before they
-- can be used", SQLSTATE 55P04). Supabase corre cada migración dentro de una
-- transacción, así que esta migración SOLO añade el valor al enum. El INSERT
-- semilla del template 'Minimal' vive en `051_site_themes_seed_minimal.sql`,
-- que ya puede referenciar 'minimal'::public.site_theme_kind con seguridad.
--
-- Idempotente: salta el ALTER cuando el valor ya existe.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'minimal'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'minimal';
  END IF;
END;
$$;
