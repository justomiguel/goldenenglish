-- Flow.cl: readable commerceOrder per checkout attempt + deterministic mapping to payments.id.
-- Older checkouts sent payments.id as commerceOrder (UUID); finalize still resolves by id.

BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.payment_flow_commerce_serial_seq;

CREATE TABLE IF NOT EXISTS public.payment_flow_checkout_refs (
  commerce_ref TEXT NOT NULL,
  payment_id UUID NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_flow_checkout_refs_commerce_ref_pkey PRIMARY KEY (commerce_ref),
  CONSTRAINT payment_flow_checkout_refs_payment_id_not_empty CHECK (
    payment_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS payment_flow_checkout_refs_payment_idx
  ON public.payment_flow_checkout_refs (payment_id);

ALTER TABLE public.payment_flow_checkout_refs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.payment_flow_checkout_refs IS 'Maps Flow commerceOrder refs to payments; many refs per payment (retries/new sessions).';

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref(
  p_payment_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off AS $$
DECLARE
  seq BIGINT;
  ref TEXT;
BEGIN
  IF p_year IS NULL OR p_year NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'invalid_year';
  END IF;
  IF p_month IS NULL OR p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'invalid_month';
  END IF;

  seq := nextval('public.payment_flow_commerce_serial_seq'::regclass);
  ref := 'MES-' || p_year::text || '-' ||
    LPAD(p_month::text, 2, '0') || '-' ||
    LPAD(seq::text, 8, '0');

  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, payment_id)
  VALUES (ref, p_payment_id);

  RETURN ref;
END;
$$;

-- Supabase callers: invoke only with service-role / admin tooling.
REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref(UUID, INT, INT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref(UUID, INT, INT) TO service_role;

COMMIT;
