-- Seed one inactive site theme per generic institute kind.
-- Stock media stays in public/generic. Wizard uploads go to Storage.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks
)
SELECT
  v.slug,
  v.name,
  FALSE,
  v.kind::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', v.primary_color,
    'color.primary.dark', v.primary_dark,
    'color.primary.foreground', v.paper,
    'color.secondary', v.secondary,
    'color.secondary.foreground', v.ink,
    'color.background', v.paper,
    'color.surface', v.surface,
    'color.foreground', v.ink,
    'color.muted', v.muted,
    'color.muted.foreground', v.muted_fg,
    'app.favicon.path', '/generic/' || v.kind || '/favicon.png',
    'app.logo.path', '/generic/' || v.kind || '/mark.svg',
    'app.logo.alt', v.name
  ),
  '{}'::jsonb,
  '[]'::jsonb
FROM (
  VALUES
    ('generic-deportes', 'Deportes', 'deportes', '#1B4332', '#0F2A1F', '#C4A484', '#1B4332', '#F6F1E8', '#FFFCF7', '#E7DDD0', '#3D4A40'),
    ('generic-jardin', 'Jardín', 'jardin', '#3D5A45', '#24362A', '#E2C56B', '#24362A', '#FBF7F0', '#FFFCF6', '#E6E0D2', '#3D4A40'),
    ('generic-colegio', 'Colegio', 'colegio', '#1C2B3A', '#101820', '#B08968', '#1C2B3A', '#F4F0EA', '#FBF8F4', '#E4DDD4', '#3A4654'),
    ('generic-musica', 'Música', 'musica', '#4A2C3A', '#2C1A24', '#C6A15B', '#4A2C3A', '#F7F3EE', '#FBF8F4', '#E8DFD6', '#5C4652'),
    ('generic-idiomas', 'Idiomas', 'idiomas', '#1E3A4C', '#122632', '#E6D3B3', '#1E3A4C', '#F7F5F2', '#FBF9F6', '#E4E0D8', '#3E5160')
) AS v(slug, name, kind, primary_color, primary_dark, secondary, ink, paper, surface, muted, muted_fg)
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = v.slug
);
