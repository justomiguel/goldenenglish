-- Mi Mundo — swap placeholder logo path to the real JPG asset.
-- Idempotent: only updates when the stored value still points at the
-- legacy /images/mimundo/logo/logo.svg placeholder, so manual overrides
-- saved via the Site Setup wizard or CMS are preserved.

UPDATE public.site_themes
SET properties = properties
    || jsonb_build_object(
         'app.logo.path',    '/images/mimundo/logo/logo.jpg',
         'app.favicon.path', '/images/mimundo/logo/logo.jpg'
       )
WHERE slug = 'mimundo'
  AND properties ->> 'app.logo.path' = '/images/mimundo/logo/logo.svg';
