-- Nagô should offer both public CTAs: reserve a spot and book a trial class.
BEGIN;

UPDATE public.site_settings
SET value = '"both"'::jsonb, updated_at = now()
WHERE key = 'public_cta_mode'
  AND EXISTS (
    SELECT 1
    FROM public.site_themes t
    WHERE t.template_kind::text = 'nago'
  );

COMMIT;
