-- Fix NEXTVAL(...) in PL/pgSQL: NEXTVAL(public.seq_name) parses as column ref on
-- relation alias "public", not as regclass → 42P01 "missing FROM-clause entry for table public".

BEGIN;

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

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref(UUID, INT, INT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref(UUID, INT, INT) TO service_role;

COMMIT;
