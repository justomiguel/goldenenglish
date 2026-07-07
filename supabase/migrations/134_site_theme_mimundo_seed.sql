-- Runs after 133 commits so 'mimundo' enum label is usable.
-- Jardín Materno Infantil Mi Mundo — dedicated Supabase project, so is_active = TRUE.
-- site_themes_only_one_active: deactivate others before setting mimundo active.

UPDATE public.site_themes
SET is_active = FALSE
WHERE slug <> 'mimundo'
  AND is_active = TRUE;

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
  'mimundo',
  'Jardín Materno Infantil Mi Mundo',
  TRUE,
  'mimundo'::public.site_theme_kind,
  jsonb_build_object(
    -- Identity
    'app.name',          'Jardín Materno Infantil Mi Mundo',
    'app.legal.name',    'Jardín Materno Infantil Mi Mundo',
    'app.tagline',       'Bienvenidos a un lugar donde la imaginación se vuelve realidad..',
    'app.tagline.en',    'Welcome to a place where imagination becomes reality..',
    'app.tagline.pt',    'Bem-vindos a um lugar onde a imaginação se torna realidade..',
    'app.legal.registry','Jardín Materno Infantil Mi Mundo',
    'app.logo.path',     '/images/mimundo/logo/logo.jpg',
    'app.logo.alt',      'Jardín Materno Infantil Mi Mundo',
    'app.favicon.path',  '/images/mimundo/logo/logo.jpg',
    -- Brand palette
    -- Primary: verde oscuro del logo — pasa AA como bg para texto blanco
    'color.primary',                '#557945',
    'color.primary.foreground',     '#FFFFFF',
    -- Secondary: azul infantil — CTAs sólidas, contraste AA sobre crema
    'color.secondary',              '#2F7DBE',
    'color.secondary.foreground',   '#FFFFFF',
    -- Accent: amarillo vivo — solo non-text / chips / decoración (regla 26)
    'color.accent',                 '#FFD426',
    'color.accent.foreground',      '#6D4C41',
    -- Error/destructive: rojo infantil
    'color.error',                  '#E22E30',
    -- Backgrounds
    'color.background',             '#FFF8EC',
    'color.surface',                '#FAF6EA',
    -- Foreground: marrón crayón — texto principal, ≥ 4.5:1 sobre crema
    'color.foreground',             '#6D4C41',
    'color.muted',                  '#8D6E63',
    'color.muted.foreground',       '#5D4037',
    -- Contact info (placeholder until real data is provided)
    'contact.phone',    '+54 11 4555-1234',
    'contact.whatsapp', 'https://wa.me/541145551234',
    'contact.email',    'hola@mimundo.com.ar',
    'contact.address',  'Resistencia, Chaco',
    -- Social
    'social.instagram', 'https://www.instagram.com/mimundo.jardin/',
    'social.facebook',  'https://www.facebook.com/mimundojardin',
    -- Billing
    'billing.currency', 'ARS',
    'billing.country',  'AR'
  ),
  '{}'::jsonb,
  '[]'::jsonb,
  FALSE
)
ON CONFLICT (slug) DO UPDATE
SET
  name          = EXCLUDED.name,
  template_kind = EXCLUDED.template_kind,
  is_active     = EXCLUDED.is_active,
  is_system_default = FALSE,
  properties    = EXCLUDED.properties;
