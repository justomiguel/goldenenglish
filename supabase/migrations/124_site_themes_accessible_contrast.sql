-- WCAG AA: fix secondary/accent foregrounds and borders on seeded templates whose
-- partial overrides inherited failing pairs from codebase defaults (#26-accessibility-contrast).
-- Global token tuning lives in src/lib/theme/systemPropertiesDefaults.ts (SYSTEM_PROPERTIES_DEFAULTS).

-- minimal: sky secondary + inherited white foreground failed contrast
UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object('color.secondary.foreground', '#0F172A'),
  updated_at = now()
WHERE slug = 'minimal';

-- nago: amber secondary + white foreground failed; accent green + inherited dark navy failed
UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'color.secondary.foreground',
      '#171717',
      'color.accent.foreground',
      '#FFFFFF'
    ),
  updated_at = now()
WHERE slug = 'nago';

-- mozarthitos palette: brighten secondary label contrast; border readable on cream/white
UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'color.secondary.foreground',
      '#0F172A',
      'color.border',
      '#8A8275'
    ),
  updated_at = now()
WHERE slug = 'mozarthitos';

-- golden-english row often stores explicit tokens; align with tightened defaults when present
UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'color.muted.foreground',
      '#4B5563',
      'color.border',
      '#8A8275'
    ),
  updated_at = now()
WHERE slug = 'golden-english';
