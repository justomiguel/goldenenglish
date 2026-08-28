-- Guest matrícula checkout for public pre-inscriptions.
-- Additive: lead token/snapshot/intake, cohort fee mode, Flow ref → registration.

BEGIN;

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS enrollment_fee_mode TEXT NOT NULL DEFAULT 'per_section';

ALTER TABLE public.academic_cohorts
  DROP CONSTRAINT IF EXISTS academic_cohorts_enrollment_fee_mode_chk;

ALTER TABLE public.academic_cohorts
  ADD CONSTRAINT academic_cohorts_enrollment_fee_mode_chk
  CHECK (enrollment_fee_mode IN ('once_for_all', 'per_section'));

COMMENT ON COLUMN public.academic_cohorts.enrollment_fee_mode IS
  'once_for_all = one matrícula covers every section; per_section = fees add up.';

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS pay_token TEXT,
  ADD COLUMN IF NOT EXISTS intake_state TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS fee_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fee_captured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_path TEXT,
  ADD COLUMN IF NOT EXISTS accepted_student_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

UPDATE public.registrations
SET pay_token = encode(gen_random_bytes(32), 'hex')
WHERE pay_token IS NULL;

ALTER TABLE public.registrations
  ALTER COLUMN pay_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_pay_token_uidx
  ON public.registrations (pay_token);

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_intake_state_chk;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_intake_state_chk
  CHECK (intake_state IN (
    'none',
    'awaiting_fee',
    'receipt_pending',
    'needs_section',
    'section_full'
  ));

ALTER TABLE public.payment_flow_checkout_refs
  ADD COLUMN IF NOT EXISTS registration_id UUID
    REFERENCES public.registrations (id) ON DELETE CASCADE;

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
  );

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_enrollment(
  p_registration_id UUID
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
  IF p_registration_id IS NULL THEN
    RAISE EXCEPTION 'invalid_registration';
  END IF;

  seq := nextval('public.payment_flow_commerce_serial_seq'::regclass);
  ref := 'MAT-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-' ||
    LPAD(seq::text, 8, '0');

  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, registration_id)
  VALUES (ref, p_registration_id);

  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_enrollment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_enrollment(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.registration_public_section_has_open_seat(p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
    WHERE s.id = p_section_id
      AND c.is_current = true
      AND c.archived_at IS NULL
      AND s.archived_at IS NULL
      AND (
        s.max_students IS NULL
        OR (
          SELECT count(*)
          FROM public.section_enrollments se
          WHERE se.section_id = s.id
            AND se.status = 'active'
        ) < s.max_students
      )
  );
$$;

COMMENT ON FUNCTION public.registration_public_section_has_open_seat(uuid) IS
  'True when the section is public, current, and still has a seat (or unlimited).';

REVOKE ALL ON FUNCTION public.registration_public_section_has_open_seat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_section_has_open_seat(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_section_has_open_seat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.registration_public_pay_context(p_token text)
RETURNS TABLE (
  first_name text,
  last_name text,
  status text,
  intake_state text,
  fee_captured boolean,
  fee_snapshot jsonb,
  preferred_section_id uuid,
  additional_section_ids uuid[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.first_name,
    r.last_name,
    r.status::text,
    r.intake_state,
    r.fee_captured,
    r.fee_snapshot,
    r.preferred_section_id,
    r.additional_section_ids
  FROM public.registrations r
  WHERE r.pay_token = p_token
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.registration_public_pay_context(text) IS
  'Safe guest projection for /matricula/[token]. No DNI, email, or tutor identity.';

REVOKE ALL ON FUNCTION public.registration_public_pay_context(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_pay_context(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_pay_context(text) TO authenticated;

COMMIT;
