-- WCAG AA: fix page-wash contrast on the Mi Mundo family portal.
--
-- `--color-muted` is the PWA page wash: ParentPwaShell.tsx paints the whole
-- mobile portal with bg-[var(--color-muted)].  The seeded brown (#8D6E63) is
-- a mid-tone, so every text token in the warm-brown / olive family measured
-- below AA (as low as 1.08:1 where WCAG needs 4.5:1).  Replacing it with a
-- light warm cream (#F2E9E1) in the same family clears all five audited pairs.
--
-- `color.primary` also moves one step darker (#557945 → #4E7040) because the
-- "Ver blog" / "Ver eventos" links sit directly on the wash and need 4.5:1 on
-- it; #4E7040 is the minimum darkening that achieves that.  All other pairs
-- involving primary are verified in the test suite.
--
-- Precedent: migration 124 (124_site_themes_accessible_contrast.sql) applied
-- the same class of fix for minimal, nago, mozarthitos and golden-english.
-- Mi Mundo was not included there because its seed (134_site_theme_mimundo_seed.sql)
-- landed ten migrations later.  This migration follows the same shape exactly.

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'color.muted',    '#F2E9E1',
      'color.primary',  '#4E7040'
    ),
  updated_at = now()
WHERE slug = 'mimundo';
