-- Public register: hide the section combo unless staff opt in.
-- Default off. Families then submit the first open section without seeing a picker.

BEGIN;

INSERT INTO public.site_settings (key, value)
VALUES ('register_show_all_sections', 'false'::jsonb)
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
      'register_show_all_sections'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard, billing, transfer instructions, billing model, public CTA, family checkout policy, and register section picker.';

COMMIT;
