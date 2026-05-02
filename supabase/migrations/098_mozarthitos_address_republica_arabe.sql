-- Sede Las Condes: dirección correcta en propiedades del tema (pie / marca / JSON-LD).

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'contact.address',
      'República Árabe de Egipto 670, Las Condes, Santiago, Chile'
    ),
  updated_at = now()
WHERE slug = 'mozarthitos';
