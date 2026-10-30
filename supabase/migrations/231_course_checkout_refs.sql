-- Course checkout uses its own commerce reference. Merch refs stay on shop_order_id.

ALTER TABLE public.payment_flow_checkout_refs
  ADD COLUMN IF NOT EXISTS course_order_id UUID
    REFERENCES public.course_orders (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payment_flow_checkout_refs_course_order_idx
  ON public.payment_flow_checkout_refs (course_order_id)
  WHERE course_order_id IS NOT NULL;

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
    OR registration_id IS NOT NULL
    OR shop_order_id IS NOT NULL
    OR course_order_id IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_course(p_course_order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off AS $$
DECLARE
  seq BIGINT;
  ref TEXT;
BEGIN
  IF p_course_order_id IS NULL THEN
    RAISE EXCEPTION 'invalid_course_order';
  END IF;
  seq := nextval('public.payment_flow_commerce_serial_seq'::regclass);
  ref := 'COURSE-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-' ||
    LPAD(seq::text, 8, '0');
  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, course_order_id)
  VALUES (ref, p_course_order_id);
  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_course(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_course(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_course(UUID) TO service_role;
