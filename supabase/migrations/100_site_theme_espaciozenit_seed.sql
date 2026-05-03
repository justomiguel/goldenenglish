-- Runs after 099 commits so 'espaciozenit' enum label is usable.

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
  'espaciozenit',
  'Espacio Zenit',
  FALSE,
  'espaciozenit'::public.site_theme_kind,
  jsonb_build_object(
    'app.name', 'Espacio Zenit',
    'app.legal.name', 'Espacio Zenit',
    'app.tagline', 'Espacio para estudiar con calma',
    'app.tagline.en', 'A calm space for focused learning',
    'app.legal.registry', 'Espacio Zenit',
    'app.logo.path', '/images/espaciozenit/inicio/1.png',
    'app.logo.alt', 'Espacio Zenit',
    'app.favicon.path', '/favicon_io/favicon.ico',
    'contact.phone', '+56 9 0000 0000',
    'contact.email', 'hola@espaciozenit.example',
    'contact.address', 'Chile',
    'social.instagram', 'https://www.instagram.com/'
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
