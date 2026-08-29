-- Trial-fee / convert Flow refs, guest RPCs, and occupancy that counts trial holds.

BEGIN;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS trial_refund_due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_trial_refund_nonneg;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_trial_refund_nonneg
  CHECK (trial_refund_due_amount >= 0);

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_trial(
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
  ref := 'TRIAL-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-' ||
    LPAD(seq::text, 8, '0');
  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, registration_id)
  VALUES (ref, p_registration_id);
  RETURN ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_join(
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
  ref := 'JOIN-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-' ||
    LPAD(seq::text, 8, '0');
  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, registration_id)
  VALUES (ref, p_registration_id);
  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_trial(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_join(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_trial(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_join(UUID) TO service_role;

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
          (
            SELECT count(*) FROM public.section_enrollments se
            WHERE se.section_id = s.id AND se.status = 'active'
          ) + (
            SELECT count(*) FROM public.registration_trial_seats ts
            WHERE ts.section_id = s.id AND ts.status IN ('booked', 'attended')
          )
        ) < s.max_students
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.registration_public_trial_pay_context(p_token text)
RETURNS TABLE (
  first_name text,
  last_name text,
  status text,
  trial_fee_captured boolean,
  trial_fee_snapshot jsonb,
  preferred_section_id uuid,
  additional_section_ids uuid[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.first_name, r.last_name, r.status::text, r.trial_fee_captured,
         r.trial_fee_snapshot, r.preferred_section_id, r.additional_section_ids
  FROM public.registrations r
  WHERE r.pay_token = p_token AND r.intent = 'trial'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.registration_public_reschedule_ok(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.registrations r
    WHERE r.trial_reschedule_token = p_token
      AND r.intent = 'trial'
      AND r.status <> 'enrolled'
      AND EXISTS (
        SELECT 1 FROM public.registration_trial_seats s
        WHERE s.registration_id = r.id AND s.status = 'absent'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.registration_public_convert_context(p_token text)
RETURNS TABLE (
  first_name text,
  last_name text,
  status text,
  expired boolean,
  seats jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN (r.trial_convert_expires_at IS NULL OR r.trial_convert_expires_at < now() OR r.status = 'enrolled')
      THEN NULL ELSE r.first_name END,
    CASE WHEN (r.trial_convert_expires_at IS NULL OR r.trial_convert_expires_at < now() OR r.status = 'enrolled')
      THEN NULL ELSE r.last_name END,
    r.status::text,
    (r.trial_convert_expires_at IS NULL OR r.trial_convert_expires_at < now() OR r.status = 'enrolled') AS expired,
    CASE WHEN (r.trial_convert_expires_at IS NULL OR r.trial_convert_expires_at < now() OR r.status = 'enrolled')
      THEN '[]'::jsonb
      ELSE COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'sectionId', s.section_id,
          'status', s.status,
          'scheduledOn', s.scheduled_on,
          'label', public.registration_public_section_label(s.section_id)
        ))
        FROM public.registration_trial_seats s
        WHERE s.registration_id = r.id
      ), '[]'::jsonb)
    END AS seats
  FROM public.registrations r
  WHERE r.trial_convert_token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.registration_public_trial_pay_context(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registration_public_reschedule_ok(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registration_public_convert_context(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_trial_pay_context(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registration_public_reschedule_ok(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registration_public_convert_context(text) TO anon, authenticated;

COMMIT;
