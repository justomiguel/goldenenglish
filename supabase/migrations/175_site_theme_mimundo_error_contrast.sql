-- WCAG AA follow-up to 174_site_theme_mimundo_contrast.sql (#26-accessibility-contrast).
-- Spec 8 gave destructive buttons a solid error fill with a white label. Measuring that
-- pair found mimundo's seeded error #E22E30 lands at 4.4995:1 against white — short of the
-- 4.5:1 AA threshold by a hair, on the highest-stakes label in the product.
-- #DE2B2D reaches 4.68:1 and is visually indistinguishable from the seeded red.
-- Border use of the token also improves: 4.33:1 on surface, 3.90:1 on the page wash,
-- both well past the 3:1 non-text threshold.

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object('color.error', '#DE2B2D'),
  updated_at = now()
WHERE slug = 'mimundo';
