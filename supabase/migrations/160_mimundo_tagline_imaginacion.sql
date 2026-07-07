-- Mi Mundo — hero tagline / app.tagline refresh (Resistencia tenant copy).

UPDATE public.site_themes
SET properties = properties
  || jsonb_build_object(
    'app.tagline',    'Bienvenidos a un lugar donde la imaginación se vuelve realidad..',
    'app.tagline.en', 'Welcome to a place where imagination becomes reality..',
    'app.tagline.pt', 'Bem-vindos a um lugar onde a imaginação se torna realidade..'
  )
WHERE slug = 'mimundo';
