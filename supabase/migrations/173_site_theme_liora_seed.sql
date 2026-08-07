-- Runs after 172 commits so the 'liora' enum label is usable.
-- Paleta tomada del logo: crema #FAF5EF, tinta marrón #3F3733, rosa viejo #C08C7D.
-- `color.primary` usa la variante oscura del rosa (#96594B) porque es la única que
-- pasa AA sobre blanco/crema (ver 124_site_themes_accessible_contrast.sql).

INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks,
  is_system_default
)
VALUES (
  'liora',
  'Liora Studio',
  FALSE,
  'liora'::public.site_theme_kind,
  jsonb_build_object(
    'app.name', 'Liora Studio',
    'app.legal.name', 'Liora Studio',
    'app.tagline', 'Danza · Movimiento · Pasión',
    'app.tagline.en', 'Dance · Movement · Passion',
    'app.tagline.pt', 'Dança · Movimento · Paixão',
    'app.legal.registry', 'Liora Studio',
    'app.logo.path', '/images/liora/logo/logo.png',
    'app.logo.alt', 'Liora Studio',
    'app.favicon.path', '/images/liora/logo/logo.png',
    -- PLACEHOLDERS: reemplazar en Configuración del sitio antes de activar el
    -- tema. `mergeProperties` ignora los overrides vacíos, así que dejarlos en
    -- blanco haría caer la landing al teléfono/email por defecto del sistema.
    'contact.phone', '+56 9 2037 6631',
    'contact.email', 'contacto@liorastudio.cl',
    'contact.address', 'Santiago, Chile',
    'social.instagram', 'https://www.instagram.com/liora.studio.cl/',
    'social.whatsapp', 'https://wa.me/56920376631',
    'color.primary', '#96594B',
    'color.primary.foreground', '#FFFFFF',
    'color.secondary', '#3F3733',
    'color.secondary.foreground', '#FFFFFF',
    'color.accent', '#C08C7D',
    'color.accent.foreground', '#332C29',
    'color.background', '#FAF5EF',
    'color.surface', '#FFFFFF',
    'color.foreground', '#3F3733',
    'color.muted', '#F7E8E2',
    'color.muted.foreground', '#6B5F58',
    'color.border', '#B99C8C',
    'layout.border.radius', '16px'
  ),
  '{}'::jsonb,
  '[]'::jsonb,
  FALSE
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  template_kind = EXCLUDED.template_kind,
  is_system_default = FALSE,
  properties = EXCLUDED.properties;
