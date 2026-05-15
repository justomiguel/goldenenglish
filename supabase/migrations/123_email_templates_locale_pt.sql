-- Allow Portuguese overrides row locale values alongside ES/EN.
ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_locale_supported;

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_locale_supported
  CHECK (locale IN ('es', 'en', 'pt'));
