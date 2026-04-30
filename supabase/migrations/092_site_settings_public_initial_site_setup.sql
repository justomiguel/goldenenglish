-- Allow anon/authenticated reads of initial_site_setup for public gating (completedAt only).
-- Previously site_settings_select_public only exposed inscriptions_enabled.

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;

CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('inscriptions_enabled', 'initial_site_setup')
  );
