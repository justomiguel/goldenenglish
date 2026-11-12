-- Public registration extras pack. The value is a domain id, not a tenant kind.
-- Additive migration per 21-migrations-production-no-data-destruction.mdc.

BEGIN;

INSERT INTO public.site_settings (key, value)
SELECT 'register.extras_pack', picked.value
FROM (
  SELECT to_jsonb(
    CASE template_kind::text
      WHEN 'nago' THEN 'martial_arts_uniform'
      WHEN 'mozarthitos' THEN 'family_guide'
    END
  ) AS value
  FROM public.site_themes
  WHERE is_active IS TRUE
    AND template_kind::text IN ('nago', 'mozarthitos')
  LIMIT 1
) AS picked
WHERE picked.value IS NOT NULL
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
      'register_section_mode',
      'register.extras_pack'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public reads for registration gating, billing, the public call to action, and the registration extras pack.';

COMMIT;
