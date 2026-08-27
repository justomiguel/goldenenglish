-- Multi-section monthly checkout (parent review: pay every payable section in one charge).
-- One Flow/MP checkout maps to N (student, section, month, year) slots.
-- Abandoned checkouts still create no payments rows (deferred creation).

BEGIN;

CREATE TABLE public.payment_monthly_checkout_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  currency TEXT NOT NULL,
  expected_total NUMERIC NOT NULL,
  section_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_monthly_checkout_bundles_year_chk CHECK (year BETWEEN 2000 AND 2100),
  CONSTRAINT payment_monthly_checkout_bundles_month_chk CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT payment_monthly_checkout_bundles_total_chk CHECK (expected_total > 0),
  CONSTRAINT payment_monthly_checkout_bundles_sections_chk CHECK (cardinality(section_ids) >= 2)
);

COMMENT ON TABLE public.payment_monthly_checkout_bundles IS
  'Deferred multi-section monthly checkout; payments rows materialize on gateway confirm.';

ALTER TABLE public.payment_monthly_checkout_bundles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.payment_monthly_checkout_bundles FROM PUBLIC;
GRANT ALL ON TABLE public.payment_monthly_checkout_bundles TO service_role;

ALTER TABLE public.payment_flow_checkout_refs
  ADD COLUMN IF NOT EXISTS bundle_id UUID
    REFERENCES public.payment_monthly_checkout_bundles (id) ON DELETE CASCADE;

ALTER TABLE public.payment_flow_checkout_refs
  DROP CONSTRAINT IF EXISTS payment_flow_checkout_refs_target_chk;

ALTER TABLE public.payment_flow_checkout_refs
  ADD CONSTRAINT payment_flow_checkout_refs_target_chk CHECK (
    payment_id IS NOT NULL
    OR (
      student_id IS NOT NULL
      AND section_id IS NOT NULL
      AND year IS NOT NULL
      AND month IS NOT NULL
    )
    OR bundle_id IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_bundle(p_bundle_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off AS $$
DECLARE
  seq BIGINT;
  ref TEXT;
BEGIN
  IF p_bundle_id IS NULL THEN
    RAISE EXCEPTION 'invalid_bundle';
  END IF;

  seq := nextval('public.payment_flow_commerce_serial_seq'::regclass);
  ref := 'MES-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-BN-' ||
    LPAD(seq::text, 8, '0');

  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, bundle_id)
  VALUES (ref, p_bundle_id);

  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_bundle(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_bundle(UUID) TO service_role;

COMMIT;
