-- PR 6: subsecciones dinámicas + template_kind para los templates de landing.
-- Ver docs/adr/2026-04-cms-blocks-and-template-kind.md.
--
-- 1. Enum `site_theme_kind`: dos personalidades visuales en v1
--    ('classic' = lo de hoy; 'editorial' = layout alternativo full-bleed).
-- 2. Columna `site_themes.template_kind` con default 'classic' para no romper
--    nada al desplegar (todas las filas existentes siguen pintando igual).
-- 3. Columna `site_themes.blocks` JSONB para subsecciones dinámicas asociadas
--    a las 6 secciones canónicas. La validación de forma/tamaño se hace en
--    las server actions (`sanitizeLandingBlocksForPersistence`); aquí solo
--    garantizamos un default seguro.
--
-- No se cambian RLS ni políticas: blocks/template_kind viven dentro de la
-- propia fila, así que las policies de SELECT/ALL ya cubren ambas columnas.

-- 1) Enum -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'site_theme_kind'
  ) THEN
    CREATE TYPE public.site_theme_kind AS ENUM ('classic', 'editorial');
  END IF;
END;
$$;

COMMENT ON TYPE public.site_theme_kind IS
  'Personalidad visual de un template de landing. classic = layout actual; editorial = shell alternativo full-bleed con tipografía display.';

-- 2) Columnas en site_themes -----------------------------------------------
ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS template_kind public.site_theme_kind
    NOT NULL DEFAULT 'classic';

ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS blocks JSONB
    NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.site_themes.template_kind IS
  'Selecciona el shell de la landing pública (LandingMainSections clásico vs editorial). Defaults a classic para retrocompatibilidad.';

COMMENT ON COLUMN public.site_themes.blocks IS
  'Array de subsecciones dinámicas (cards/callouts/quotes) asociadas a las secciones canónicas. Validado por server actions (sanitizeLandingBlocksForPersistence). Cap suave de 24 bloques por template.';

-- 3) Backfill defensivo (no debería hacer falta por DEFAULT, pero idempotente) -
UPDATE public.site_themes
SET template_kind = 'classic'
WHERE template_kind IS NULL;

UPDATE public.site_themes
SET blocks = '[]'::jsonb
WHERE blocks IS NULL;
