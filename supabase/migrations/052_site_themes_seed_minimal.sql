-- Seed: 'Minimal' site_theme template
-- Provides a third template with template_kind = 'minimal' so admins can
-- duplicate / activate it from the CMS without manual SQL. Idempotent: only
-- inserts when no row with this slug exists.
--
-- Va en una migración separada de la que añade el valor al enum (050) porque
-- Postgres exige que los nuevos valores de enum estén "committed" antes de
-- poder usarse en consultas (SQLSTATE 55P04). Como cada migración corre en su
-- propia transacción, separar el ALTER del INSERT garantiza que 'minimal' ya
-- existe y está disponible en el catálogo cuando llegamos al cast aquí abajo.

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
  'minimal',
  'Minimal',
  FALSE,
  'minimal'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#0F172A',
    'color.secondary', '#0EA5E9',
    'color.background', '#FFFFFF',
    'color.surface', '#F8FAFC',
    'color.muted', '#E2E8F0',
    'color.foreground', '#0F172A',
    'layout.border-radius', '12px'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes WHERE slug = 'minimal'
);
