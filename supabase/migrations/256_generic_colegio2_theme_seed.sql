-- Inactive theme for Colegio 2. Colors stay overridable.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks
)
SELECT
  'generic-colegio2',
  'Colegio 2',
  FALSE,
  'colegio2'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#FF5C24',
    'color.primary.dark', '#C43E10',
    'color.primary.foreground', '#0E1A2B',
    'color.secondary', '#F3EDE4',
    'color.secondary.foreground', '#0E1A2B',
    'color.background', '#0E1A2B',
    'color.surface', '#162536',
    'color.foreground', '#F3EDE4',
    'color.muted', '#243246',
    'color.muted.foreground', '#D5D0C8',
    'app.favicon.path', '/generic/colegio2/mark.svg',
    'app.logo.path', '/generic/colegio2/mark.svg',
    'app.logo.alt', 'Colegio 2'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = 'generic-colegio2'
);
