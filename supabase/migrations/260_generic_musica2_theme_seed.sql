-- Inactive theme for Música 2. Colors stay overridable.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks
)
SELECT
  'generic-musica2',
  'Música 2',
  FALSE,
  'musica2'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#FF4B1F',
    'color.primary.dark', '#C4320C',
    'color.primary.foreground', '#09090B',
    'color.secondary', '#B388FF',
    'color.secondary.foreground', '#09090B',
    'color.background', '#09090B',
    'color.surface', '#16161A',
    'color.foreground', '#F5F1EA',
    'color.muted', '#2A2A30',
    'color.muted.foreground', '#D5D0C8',
    'app.favicon.path', '/generic/musica2/mark.svg',
    'app.logo.path', '/generic/musica2/mark.svg',
    'app.logo.alt', 'Música 2'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = 'generic-musica2'
);
