-- Runs after 107 commits so 'nago' enum label is usable.

INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks,
  is_system_default
)
VALUES (
  'nago',
  'Capoeira Nago',
  FALSE,
  'nago'::public.site_theme_kind,
  jsonb_build_object(
    'app.name', 'Capoeira Nago',
    'app.legal.name', 'Capoeira Nago',
    'app.tagline', 'Tradición que se mueve, cultura que se vive',
    'app.tagline.en', 'Tradition that moves, culture that lives',
    'app.legal.registry', 'Capoeira Nago',
    'app.logo.path', '/images/nago/logo/logo.png',
    'app.logo.alt', 'Capoeira Nago',
    'app.favicon.path', '/images/nago/favicon.ico',
    'contact.phone', '+56 9 0000 0000',
    'contact.email', 'info@capoeiranago.cl',
    'contact.address', 'Chile',
    'social.instagram', 'https://www.instagram.com/capoeiranago/',
    'social.facebook', 'https://www.facebook.com/capoeiranago/',
    'color.primary', '#1B5E20',
    'color.secondary', '#FFD54F',
    'color.accent', '#2E7D32'
  ),
  '{}'::jsonb,
  '[]'::jsonb,
  FALSE
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  template_kind = EXCLUDED.template_kind,
  is_system_default = FALSE,
  properties = EXCLUDED.properties;
