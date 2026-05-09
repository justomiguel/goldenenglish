-- Flow.cl (Chile): encrypted gateway credentials + RPC for checkout visibility
-- without exposing API keys (authenticated can call boolean RPC only).

CREATE TABLE IF NOT EXISTS public.payment_gateway_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider = 'flow'),
  country_code TEXT NOT NULL CHECK (char_length(country_code) = 2),
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  api_key_encrypted TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_gateway_credentials_provider_country_uidx UNIQUE (provider, country_code)
);

DROP TRIGGER IF EXISTS payment_gateway_credentials_set_updated_at ON public.payment_gateway_credentials;
CREATE TRIGGER payment_gateway_credentials_set_updated_at
  BEFORE UPDATE ON public.payment_gateway_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_gateway_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_gateway_credentials_admin_all ON public.payment_gateway_credentials;
CREATE POLICY payment_gateway_credentials_admin_all ON public.payment_gateway_credentials
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_flow_chile_checkout_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT c.enabled
      FROM public.payment_gateway_credentials c
      WHERE c.provider = 'flow'
        AND c.country_code = 'CL'
      LIMIT 1
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_flow_chile_checkout_enabled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_flow_chile_checkout_enabled() TO authenticated;
