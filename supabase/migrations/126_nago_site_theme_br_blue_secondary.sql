-- Nago: shift theme secondary from warm yellow (DS buttons) to Brazilian flag navy blue
-- for readable white-on-accent pairs and alignment with landing tokens (see `nagoLanding.css`).

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'color.secondary',
      '#002776',
      'color.secondary.foreground',
      '#FFFFFF'
    ),
  updated_at = now()
WHERE slug = 'nago';
