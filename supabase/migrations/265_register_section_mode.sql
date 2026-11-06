-- Public register section mode: student choice, first open section, or staff assign later.
-- Additive migration per 21-migrations-production-no-data-destruction.mdc.

BEGIN;

INSERT INTO public.site_settings (key, value)
SELECT
  'register_section_mode',
  CASE
    WHEN value = 'true'::jsonb THEN '"student_choice"'::jsonb
    ELSE '"first_open"'::jsonb
  END
FROM public.site_settings
WHERE key = 'register_show_all_sections'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('register_section_mode', '"first_open"'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;

CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'inscriptions_enabled',
      'initial_site_setup',
      'billing_currency',
      'bank_transfer_instructions',
      'billing_model',
      'public_cta_mode',
      'credit_paid_trial_on_enroll',
      'allow_parent_partial_section_payments',
      'register_show_all_sections',
      'register_section_mode'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard, billing, transfer instructions, billing model, public CTA, family checkout policy, and register section mode.';

COMMIT;
