-- Admin toggle: accept bank transfer on public event registration.
-- Controlled from Finance → Settings. When true, the registration form offers a
-- "Bank transfer" payment method (transfer details + receipt upload) alongside
-- online gateways (Mercado Pago / Flow). Read server-side via the admin client
-- in loadEventRegistrationPaymentMethods; written by admins through
-- site_settings_all_admin RLS. Default true so transfer coexists with gateways.

INSERT INTO public.site_settings (key, value)
VALUES ('events_bank_transfer_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
