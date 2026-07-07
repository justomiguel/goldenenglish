-- Mi Mundo — Resistencia location + materno infantil legal identity (brand layer).

UPDATE public.site_themes
SET
  name = 'Jardín Materno Infantil Mi Mundo',
  properties = properties
    || jsonb_build_object(
      'app.name',           'Jardín Materno Infantil Mi Mundo',
      'app.legal.name',     'Jardín Materno Infantil Mi Mundo',
      'app.legal.registry', 'Jardín Materno Infantil Mi Mundo',
      'app.logo.alt',       'Jardín Materno Infantil Mi Mundo',
      'contact.address',    'Resistencia, Chaco'
    )
WHERE slug = 'mimundo';
