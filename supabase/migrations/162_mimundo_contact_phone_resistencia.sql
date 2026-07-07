-- Mi Mundo — real contact phone (Resistencia, Chaco).

UPDATE public.site_themes
SET properties = properties
  || jsonb_build_object(
    'contact.phone',    '+54 9 362 470-8145',
    'contact.whatsapp', 'https://wa.me/5493624708145'
  )
WHERE slug = 'mimundo';
