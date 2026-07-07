-- Mi Mundo — public contact email.

UPDATE public.site_themes
SET properties = properties
  || jsonb_build_object('contact.email', 'mimundojardin@gmail.com')
WHERE slug = 'mimundo';
