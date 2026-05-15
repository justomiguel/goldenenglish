-- Mozarthitos: fondo de contacto / redes en `site_themes.properties` (merge, no pisa otras claves).
-- Así el pie usa la marca del tema y no solo `SYSTEM_PROPERTIES_DEFAULTS` (Golden).

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'contact.phone', '+56 9 5991 6314',
      'contact.email', 'info@mozarthitos.cl',
      'contact.address', 'Santiago, Chile',
      'social.instagram', 'https://www.instagram.com/mozarthitos/'
    ),
  updated_at = now()
WHERE slug = 'mozarthitos';
