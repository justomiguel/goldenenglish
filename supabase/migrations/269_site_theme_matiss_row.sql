-- Inactive `matiss` theme row. Runs after 268 commits so the enum label exists.
-- Product SQL on purpose: shared-schema targets skip brand-data files, and this
-- row must exist inside `tenant_matiss`. The owner map in
-- `EXCLUSIVE_THEME_OWNERS` decides who may select it.
-- Palette sampled from the client logo. Text colors are darker shades of the
-- same hues so they pass WCAG AA on the blush background.

INSERT INTO public.site_themes (
  slug, name, is_active, template_kind, properties, content, blocks, is_system_default
)
SELECT
  'matiss',
  'Matiss Studio',
  FALSE,
  'matiss'::public.site_theme_kind,
  jsonb_build_object(
    'app.name', 'Matiss Studio',
    'app.legal.name', 'Matiss Studio',
    'app.tagline', 'Gimnasia acrobática para niñas',
    'app.tagline.en', 'Acrobatic gymnastics for girls',
    'app.tagline.pt', 'Ginástica acrobática para meninas',
    'app.legal.registry', 'Matiss Studio',
    'app.logo.path', '/images/matiss/logo/logo.png',
    'app.logo.alt', 'Matiss Studio',
    'app.favicon.path', '/images/matiss/logo/logo.png',
    'contact.phone', '+56 9 8747 6023',
    'contact.email', 'valentinatapiacarrasco@gmail.com',
    'contact.address', 'San Miguel y La Florida, Santiago',
    'social.instagram', 'https://www.instagram.com/matiss.studio/',
    'social.whatsapp', 'https://wa.me/56987476023',
    'color.primary', '#6B4C9E',
    'color.primary.foreground', '#FFFFFF',
    'color.secondary', '#A6458E',
    'color.secondary.foreground', '#FFFFFF',
    'color.accent', '#F0BEE6',
    'color.accent.foreground', '#3A2A52',
    'color.background', '#FCF4F7',
    'color.surface', '#FFFFFF',
    'color.foreground', '#3A2A52',
    'color.muted', '#F0E4F0',
    'color.muted.foreground', '#665A78',
    'color.border', '#D8C0E4',
    'layout.border.radius', '20px'
  ),
  '{}'::jsonb,
  '[]'::jsonb,
  FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes t WHERE t.slug = 'matiss'
);
