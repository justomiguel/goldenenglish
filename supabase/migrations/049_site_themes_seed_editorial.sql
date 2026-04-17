-- Seed: 'Editorial' site_theme template
-- Provides a second template with template_kind = 'editorial' so admins can
-- duplicate / activate it from the CMS without manual SQL. Idempotent: only
-- inserts when no row with this slug exists.

INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks
)
SELECT
  'editorial',
  'Editorial',
  FALSE,
  'editorial'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#1F2937',
    'color.secondary', '#B45309',
    'color.background', '#FAFAF9',
    'color.surface', '#FFFFFF',
    'color.muted', '#E7E5E4',
    'color.foreground', '#111827',
    'layout.border-radius', '4px'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes WHERE slug = 'editorial'
);

COMMENT ON COLUMN public.site_themes.template_kind IS
  'Selecciona el shell de la landing pública (LandingMainSections clásico vs editorial). Defaults a classic para retrocompatibilidad.';
