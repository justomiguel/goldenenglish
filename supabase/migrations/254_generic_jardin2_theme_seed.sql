-- Inactive theme for Jardín 2. Colors stay overridable.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks
)
SELECT
  'generic-jardin2',
  'Jardín 2',
  FALSE,
  'jardin2'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#3E5C45',
    'color.primary.dark', '#2A4030',
    'color.primary.foreground', '#F4EFE4',
    'color.secondary', '#C4785A',
    'color.secondary.foreground', '#24312C',
    'color.background', '#F4EFE4',
    'color.surface', '#FBF7F0',
    'color.foreground', '#24312C',
    'color.muted', '#E4D9CC',
    'color.muted.foreground', '#4A564F',
    'app.favicon.path', '/generic/jardin2/mark.svg',
    'app.logo.path', '/generic/jardin2/mark.svg',
    'app.logo.alt', 'Jardín 2'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = 'generic-jardin2'
);
