-- MercadoPago Checkout Pro: extend gateway credentials, finalize records, portal RPC.

BEGIN;

-- Allow mercadopago alongside flow
ALTER TABLE public.payment_gateway_credentials
  DROP CONSTRAINT IF EXISTS payment_gateway_credentials_provider_check;

ALTER TABLE public.payment_gateway_credentials
  ADD CONSTRAINT payment_gateway_credentials_provider_check
  CHECK (provider IN ('flow', 'mercadopago'));

ALTER TABLE public.payment_gateway_credentials
  ADD COLUMN IF NOT EXISTS webhook_secret_encrypted TEXT;

COMMENT ON COLUMN public.payment_gateway_credentials.webhook_secret_encrypted IS
  'AES-GCM encrypted webhook signing secret (MercadoPago). NULL for Flow.';

-- Track which gateway approved a payment + active MP preference
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gateway_provider TEXT
  CHECK (gateway_provider IS NULL OR gateway_provider IN ('flow', 'mercadopago'));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;

COMMENT ON COLUMN public.payments.gateway_provider IS
  'Online checkout provider when status=approved via gateway; NULL for receipt uploads.';

COMMENT ON COLUMN public.payments.mp_preference_id IS
  'Latest MercadoPago Checkout Pro preference id for this payment row.';

CREATE INDEX IF NOT EXISTS payments_mp_preference_id_idx
  ON public.payments (mp_preference_id)
  WHERE mp_preference_id IS NOT NULL;

-- MercadoPago finalize snapshot (mirrors payment_flow_finalize_records)
CREATE TABLE IF NOT EXISTS public.payment_mp_finalize_records (
  payment_id UUID PRIMARY KEY REFERENCES public.payments (id) ON DELETE CASCADE,
  mp_payment_id BIGINT NOT NULL,
  mp_preference_id TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (char_length(currency) BETWEEN 3 AND 8),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ NOT NULL,
  payer_email TEXT,
  payment_method TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_mp_finalize_records_mp_payment_id_idx
  ON public.payment_mp_finalize_records (mp_payment_id);

DROP TRIGGER IF EXISTS payment_mp_finalize_records_set_updated_at
  ON public.payment_mp_finalize_records;
CREATE TRIGGER payment_mp_finalize_records_set_updated_at
  BEFORE UPDATE ON public.payment_mp_finalize_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_mp_finalize_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_mp_finalize_records_select
  ON public.payment_mp_finalize_records;
CREATE POLICY payment_mp_finalize_records_select
  ON public.payment_mp_finalize_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_mp_finalize_records.payment_id
        AND (
          public.is_admin(auth.uid())
          OR p.student_id = auth.uid()
          OR p.parent_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles t
            WHERE t.id = auth.uid() AND t.role = 'teacher'
          )
          OR public.tutor_can_view_student_finance(auth.uid(), p.student_id)
        )
    )
  );

COMMENT ON TABLE public.payment_mp_finalize_records IS
  'Snapshot of MercadoPago payment when a payments row transitioned to approved via Checkout Pro.';

-- Enabled providers for a billing country (CL, AR, …) — no secret columns exposed
CREATE OR REPLACE FUNCTION public.enabled_payment_gateways_for_country(p_country_code text)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(c.provider ORDER BY c.provider),
    ARRAY[]::text[]
  )
  FROM public.payment_gateway_credentials c
  WHERE c.enabled = true
    AND upper(trim(c.country_code)) = upper(trim(p_country_code));
$$;

REVOKE ALL ON FUNCTION public.enabled_payment_gateways_for_country(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enabled_payment_gateways_for_country(text) TO authenticated;

COMMIT;
