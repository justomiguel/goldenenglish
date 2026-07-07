-- Mi Mundo — transparent PNG logo (replaces legacy logo.jpg path).

UPDATE public.site_themes
SET properties = properties
  || jsonb_build_object(
    'app.logo.path',    '/images/mimundo/logo/logo.png',
    'app.favicon.path', '/images/mimundo/logo/logo.png'
  )
WHERE slug = 'mimundo';
