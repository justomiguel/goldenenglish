-- Runs after 093 commits so 'mozarthitos' enum label is usable.

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
  'mozarthitos',
  'Mozarthitos',
  FALSE,
  'mozarthitos'::public.site_theme_kind,
  jsonb_build_object(
    'app.name', 'Mozarthitos',
    'app.legal.name', 'Academia Mozarthitos',
    'app.tagline', 'Primera Academia en Chile y Sudamérica con alfabetización sonora',
    'app.tagline.en', 'First academy in Chile and South America with sound literacy',
    'app.legal.registry', 'Mozarthitos',
    'app.logo.path', '/images/mozarthitos/inicio/1.png',
    'app.logo.alt', 'Mozarthitos',
    'app.favicon.path', '/favicon_io/favicon.ico',
    'contact.phone', '+56 9 5991 6314',
    'contact.email', 'info@mozarthitos.cl',
    'contact.address', 'Santiago, Chile',
    'social.instagram', 'https://www.instagram.com/mozarthitos/'
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
