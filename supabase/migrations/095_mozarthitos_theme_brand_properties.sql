-- Brand overrides for mozarthitos (idempotent). Apps that ran 094 before
-- properties were seeded need this update; fresh installs already have them via 094.

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'app.name', 'Mozarthitos',
      'app.legal.name', 'Academia Mozarthitos',
      'app.tagline', 'Primera Academia en Chile y Sudamérica con alfabetización sonora',
      'app.tagline.en', 'First academy in Chile and South America with sound literacy',
      'app.legal.registry', 'Mozarthitos',
      'app.logo.path', '/images/mozarthitos/inicio/1.png',
      'app.logo.alt', 'Mozarthitos',
      'app.favicon.path', '/favicon_io/favicon.ico'
    ),
  updated_at = now()
WHERE slug = 'mozarthitos';
