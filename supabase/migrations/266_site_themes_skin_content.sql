-- CentroListo skins: one editable content model for generic templates.
-- Additive. No data rewrite. See docs/adr/2026-11-centrolisto-template-skins.md.

ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS skin_content JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.site_themes.skin_content IS
  'Owner values for CentroListo skins: { "v": 1, "sections": { <sectionId>: { "fields": {...}, "lists": {...} } } }. Empty object means skin defaults.';
