-- Mozarthitos — public contact email (and phone / Instagram) on the active theme row.
-- Live drift: slug `mozarthitos` lacked contact.email so mail footers fell back to
-- SYSTEM_PROPERTIES_DEFAULTS (Golden: crisins@hotmail.com). Correct value lived only
-- on inactive slug `default`. See spec 2026-07-12-mozarthitos-contact-email-design.

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'contact.email', 'mozarthitos@gmail.com',
      'contact.phone', '+56 9 5991 6314',
      'social.instagram', 'https://www.instagram.com/mozarthitos/'
    ),
  updated_at = now()
WHERE slug = 'mozarthitos';
