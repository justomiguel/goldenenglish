-- Parents/students resolve online payment gateways via loadBillingCurrencySetting +
-- enabled_payment_gateways_for_country. billing_currency was admin-only in SELECT RLS
-- (106_billing_currency_setting.sql), so portal sessions fell back to USD → no CL/AR
-- gateways → "Pagar online" tab stayed disabled despite admin Flow/MP config.

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;

CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('inscriptions_enabled', 'initial_site_setup', 'billing_currency')
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard state, and portal billing currency (non-secret ISO code).';
