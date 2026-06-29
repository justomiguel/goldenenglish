-- 159_tuition_defer_payment_creation.sql
--
-- Deferred monthly tuition payment lifecycle (mirrors 158 for events).
--
-- Previously the Mercado Pago / Flow checkout start for monthly tuition pre-created a
-- `pending` payments row (resolveStudentPaymentSlot). Abandoned or rejected gateway
-- checkouts left "ghost" pending payments in the admin approval queue.
--
-- New contract:
--   * Online gateways (Mercado Pago / Flow): the payments row is materialized as
--     `approved` only when the gateway confirms payment (return reconciliation / webhook),
--     via upsertApprovedMonthlyPaymentCore.
--   * Bank transfer: the payments row is materialized as `pending` only when the student
--     or tutor uploads a receipt for manual admin review (resolveStudentPaymentSlot).
--
-- Mercado Pago carries the billing slot in `external_reference`
-- (`tuition:<studentId>:<sectionId>:<year>:<month>[:<parentId>]`). Flow's commerceOrder
-- max length forces a server-side mapping, so payment_flow_checkout_refs is generalized
-- here to store the slot when no payment row exists yet.

BEGIN;

-- 1) Generalize payment_flow_checkout_refs: a checkout ref may now point at either a
--    legacy payments.id OR a not-yet-materialized tuition slot.
ALTER TABLE public.payment_flow_checkout_refs
  ADD COLUMN IF NOT EXISTS student_id UUID
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS section_id UUID
    REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_id UUID
    REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS year INT,
  ADD COLUMN IF NOT EXISTS month INT;

ALTER TABLE public.payment_flow_checkout_refs
  ALTER COLUMN payment_id DROP NOT NULL;

-- Replace the legacy "payment_id required" check with one that accepts either a
-- legacy payment_id mapping or a complete tuition slot mapping.
ALTER TABLE public.payment_flow_checkout_refs
  DROP CONSTRAINT IF EXISTS payment_flow_checkout_refs_payment_id_not_empty;

DO $$
BEGIN
  ALTER TABLE public.payment_flow_checkout_refs
    ADD CONSTRAINT payment_flow_checkout_refs_target_chk CHECK (
      payment_id IS NOT NULL
      OR (
        student_id IS NOT NULL
        AND section_id IS NOT NULL
        AND year IS NOT NULL
        AND month IS NOT NULL
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.payment_flow_checkout_refs
    ADD CONSTRAINT payment_flow_checkout_refs_month_chk CHECK (
      month IS NULL OR (month >= 1 AND month <= 12)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.payment_flow_checkout_refs
    ADD CONSTRAINT payment_flow_checkout_refs_year_chk CHECK (
      year IS NULL OR (year >= 2000 AND year <= 2100)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS payment_flow_checkout_refs_slot_idx
  ON public.payment_flow_checkout_refs (student_id, section_id, year, month);

COMMENT ON TABLE public.payment_flow_checkout_refs IS
  'Maps Flow commerceOrder refs to either a legacy payments.id or a deferred tuition slot (student/section/year/month); many refs per target (retries/new sessions).';

-- 2) New reservation RPC for the deferred (slot) model: no payments row exists yet.
CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_slot(
  p_student_id UUID,
  p_section_id UUID,
  p_year INT,
  p_month INT,
  p_parent_id UUID DEFAULT NULL
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
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'invalid_student';
  END IF;
  IF p_section_id IS NULL THEN
    RAISE EXCEPTION 'invalid_section';
  END IF;
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

  INSERT INTO public.payment_flow_checkout_refs (
    commerce_ref, student_id, section_id, parent_id, year, month
  )
  VALUES (ref, p_student_id, p_section_id, p_parent_id, p_year, p_month);

  RETURN ref;
END;
$$;

-- Supabase callers: invoke only with service-role / admin tooling.
REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_slot(UUID, UUID, INT, INT, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_slot(UUID, UUID, INT, INT, UUID) TO service_role;

COMMIT;
