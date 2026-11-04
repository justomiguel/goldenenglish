-- Inactive theme for Lenguas 2. Colors stay overridable.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks
)
SELECT
  'generic-idiomas2',
  'Lenguas 2',
  FALSE,
  'idiomas2'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#1D3BFF',
    'color.primary.dark', '#0E1F99',
    'color.primary.foreground', '#F7F4EC',
    'color.secondary', '#E6FF3A',
    'color.secondary.foreground', '#111111',
    'color.background', '#F7F4EC',
    'color.surface', '#FFFFFF',
    'color.foreground', '#111111',
    'color.muted', '#E7E2D6',
    'color.muted.foreground', '#3A3A3A',
    'app.favicon.path', '/generic/idiomas2/mark.svg',
    'app.logo.path', '/generic/idiomas2/mark.svg',
    'app.logo.alt', 'Lenguas 2'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = 'generic-idiomas2'
);
