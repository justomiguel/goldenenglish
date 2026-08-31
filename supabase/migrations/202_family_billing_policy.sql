-- Institute family-checkout policy:
--   * credit a captured trial fee against the first enrollment + tuition invoice
--   * optionally require the parent to pay every due section (no "this class only")
-- Defaults keep today's behaviour: credit on, partial section payments on.
-- Keys are readable by anon/authenticated so the public convert page and the
-- parent portal can apply the same rules the admin configured.

BEGIN;

INSERT INTO public.site_settings (key, value)
VALUES
  ('credit_paid_trial_on_enroll', 'true'::jsonb),
  ('allow_parent_partial_section_payments', 'true'::jsonb)
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
      'allow_parent_partial_section_payments'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard, billing, transfer instructions, billing model, public CTA, and family checkout policy.';

COMMIT;
