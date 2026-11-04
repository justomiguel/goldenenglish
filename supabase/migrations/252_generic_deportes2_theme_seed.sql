-- Inactive theme for the Deportes dos template. Colors stay overridable.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks
)
SELECT
  'generic-deportes2',
  'Deportes dos',
  FALSE,
  'deportes2'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#C6F531',
    'color.primary.dark', '#8FB000',
    'color.primary.foreground', '#121410',
    'color.secondary', '#F4F4F0',
    'color.secondary.foreground', '#121410',
    'color.background', '#121410',
    'color.surface', '#1C1F1A',
    'color.foreground', '#F4F4F0',
    'color.muted', '#2A2E28',
    'color.muted.foreground', '#C8C8C0',
    'app.favicon.path', '/generic/deportes2/mark.svg',
    'app.logo.path', '/generic/deportes2/mark.svg',
    'app.logo.alt', 'Deportes dos'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = 'generic-deportes2'
);
