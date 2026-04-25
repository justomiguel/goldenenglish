-- Migration 067: enrollment fee receipt upload (student/parent/tutor)
--
-- Students, parents and tutors can upload a payment receipt for the enrollment
-- fee charged per academic section.  The receipt is stored in the existing
-- `payment-receipts` storage bucket under the path
--   {student_id}/enrollment-fee/{enrollment_id}-{timestamp}.{ext}
-- The path always starts with the student's own UUID, which satisfies the RLS
-- check already in use for monthly payment receipts.
--
-- Admin can then approve or reject the receipt from the billing tab.
-- Approval also records `last_enrollment_paid_at` automatically.

ALTER TABLE public.section_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_url        TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_status     TEXT
    CONSTRAINT section_enrollments_receipt_status_check
    CHECK (enrollment_fee_receipt_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_url IS
  'Storage path in the payment-receipts bucket for the enrollment fee receipt uploaded by the student / parent.';
COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_status IS
  'Review status of the enrollment fee receipt: pending | approved | rejected.';
COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_uploaded_at IS
  'When the student/parent last uploaded the enrollment fee receipt.';

CREATE OR REPLACE FUNCTION public.submit_enrollment_fee_receipt(
  p_student_id UUID,
  p_enrollment_id UUID,
  p_section_id UUID,
  p_receipt_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_role TEXT;
  v_enrollment public.section_enrollments%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000';
  END IF;

  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF p_student_id = v_actor_id THEN
    IF v_actor_role <> 'student' THEN
      RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
  ELSIF v_actor_role <> 'parent'
    OR NOT public.tutor_can_view_student_finance(v_actor_id, p_student_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_receipt_url IS NULL
    OR btrim(p_receipt_url) = ''
    OR p_receipt_url LIKE '%..%'
    OR p_receipt_url NOT LIKE (p_student_id::TEXT || '/enrollment-fee/%') THEN
    RAISE EXCEPTION 'invalid_receipt_url' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_enrollment
  FROM public.section_enrollments
  WHERE id = p_enrollment_id
    AND student_id = p_student_id
    AND section_id = p_section_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'enrollment_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_enrollment.enrollment_fee_exempt, false) THEN
    RAISE EXCEPTION 'enrollment_fee_exempt' USING ERRCODE = '23514';
  END IF;

  IF v_enrollment.enrollment_fee_receipt_status = 'approved' THEN
    RAISE EXCEPTION 'enrollment_receipt_already_approved' USING ERRCODE = '23514';
  END IF;

  UPDATE public.section_enrollments
  SET
    enrollment_fee_receipt_url = p_receipt_url,
    enrollment_fee_receipt_status = 'pending',
    enrollment_fee_receipt_uploaded_at = now()
  WHERE id = v_enrollment.id;

  RETURN v_enrollment.id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_enrollment_fee_receipt(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_enrollment_fee_receipt(UUID, UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.submit_enrollment_fee_receipt(UUID, UUID, UUID, TEXT) IS
  'Persists a student/tutor enrollment fee receipt on section_enrollments after actor and path validation; avoids broad RLS UPDATE on the enrollment row.';
