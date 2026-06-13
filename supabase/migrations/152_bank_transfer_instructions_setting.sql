-- Institute-wide bank transfer destination details (Finanzas → Configuración).
-- Shown before transfer receipt upload on monthly payments and public event registration.

INSERT INTO public.site_settings (key, value)
VALUES ('bank_transfer_instructions', '""'::jsonb)
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
      'bank_transfer_instructions'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard state, billing currency, and bank transfer instructions (non-secret plain text).';
