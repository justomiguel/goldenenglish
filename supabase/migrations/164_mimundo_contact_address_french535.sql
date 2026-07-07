-- Mi Mundo — street address (French 535, Resistencia).

UPDATE public.site_themes
SET properties = properties
  || jsonb_build_object('contact.address', 'French 535, Resistencia, Chaco')
WHERE slug = 'mimundo';
