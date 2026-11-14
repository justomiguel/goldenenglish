-- Move a student and the agreements staff checked, in one transaction.
-- A replaced month stays in the table with superseded_at set. Current payment
-- reads must filter superseded_at IS NULL. A receipt lookup by id still loads it.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superseded_by_payment_id UUID;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_superseded_by_payment_id_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_superseded_by_payment_id_fkey
  FOREIGN KEY (superseded_by_payment_id) REFERENCES public.payments (id) ON DELETE SET NULL;

DROP INDEX IF EXISTS public.payments_student_section_period_uidx;

CREATE UNIQUE INDEX payments_student_section_period_uidx
  ON public.payments (student_id, section_id, month, year)
  WHERE section_id IS NOT NULL AND superseded_at IS NULL;

COMMENT ON COLUMN public.payments.superseded_at IS
  'Set when a section move replaces this month. Current lists and slot lookups ignore this row.';

CREATE OR REPLACE FUNCTION public.move_student_section_with_carry(
  p_student_id UUID,
  p_to_section_id UUID,
  p_from_enrollment_ids UUID[],
  p_also_transfer_enrollment_id UUID,
  p_allow_capacity_override BOOLEAN,
  p_default_max_students INT,
  p_carry JSONB,
  p_choices JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_payments BOOLEAN := COALESCE((p_carry->>'payments')::BOOLEAN, false);
  v_scholarships BOOLEAN := COALESCE((p_carry->>'scholarships')::BOOLEAN, false);
  v_fee BOOLEAN := COALESCE((p_carry->>'enrollmentFee')::BOOLEAN, false);
  v_annual BOOLEAN := COALESCE((p_carry->>'annualSettlement')::BOOLEAN, false);
  v_attendance BOOLEAN := COALESCE((p_carry->>'attendance')::BOOLEAN, false);
  v_grades BOOLEAN := COALESCE((p_carry->>'grades')::BOOLEAN, false);
  v_from_count INT := COALESCE(array_length(p_from_enrollment_ids, 1), 0);
  v_moved INT;
  v_pay RECORD;
  v_sch RECORD;
  v_fee_row public.section_enrollments%ROWTYPE;
  v_dest_id UUID;
  v_origin_count INT;
  v_choice TEXT;
  v_key TEXT;
  v_taken TEXT[] := '{}';
  v_plan JSONB := '[]'::JSONB;
  v_elem JSONB;
  v_origin UUID;
  v_dest_sch UUID[] := '{}';
  v_sch_moves UUID[] := '{}';
  v_deactivate UUID[] := '{}';
  v_commit JSONB;
  v_new_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ACADEMIC_NOT_ADMIN';
  END IF;

  IF p_from_enrollment_ids IS NULL THEN
    p_from_enrollment_ids := '{}';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.section_enrollments e
    WHERE e.id = ANY(p_from_enrollment_ids)
      AND e.section_id = p_to_section_id
  ) THEN
    RAISE EXCEPTION 'SECTION_MOVE_SAME';
  END IF;

  IF v_from_count > 0 THEN
    PERFORM 1
    FROM public.section_enrollments e
    WHERE e.id = ANY(p_from_enrollment_ids)
      AND e.student_id = p_student_id
      AND e.status = 'active'
    FOR UPDATE;
  END IF;

  IF v_payments THEN
    FOR v_pay IN
      SELECT DISTINCT p.id, p.month, p.year
      FROM public.payments p
      WHERE p.student_id = p_student_id
        AND p.superseded_at IS NULL
        AND p.section_id IN (
          SELECT e.section_id
          FROM public.section_enrollments e
          WHERE e.id = ANY(p_from_enrollment_ids)
        )
    LOOP
      SELECT count(*)::INT INTO v_origin_count
      FROM public.payments p2
      WHERE p2.student_id = p_student_id
        AND p2.superseded_at IS NULL
        AND p2.month = v_pay.month
        AND p2.year = v_pay.year
        AND p2.section_id IN (
          SELECT e.section_id
          FROM public.section_enrollments e
          WHERE e.id = ANY(p_from_enrollment_ids)
        );

      SELECT p3.id INTO v_dest_id
      FROM public.payments p3
      WHERE p3.student_id = p_student_id
        AND p3.section_id = p_to_section_id
        AND p3.month = v_pay.month
        AND p3.year = v_pay.year
        AND p3.superseded_at IS NULL
      LIMIT 1;

      v_key := v_pay.year::TEXT || '-' || v_pay.month::TEXT;
      IF v_dest_id IS NOT NULL OR v_origin_count > 1 THEN
        SELECT elem->>'choice' INTO v_choice
        FROM jsonb_array_elements(COALESCE(p_choices, '[]'::JSONB)) elem
        WHERE elem->>'originId' = v_pay.id::TEXT
        LIMIT 1;
        IF v_choice IS DISTINCT FROM 'leave' AND v_choice IS DISTINCT FROM 'replace' THEN
          RAISE EXCEPTION 'CARRY_CHOICE_MISSING:%', v_key;
        END IF;
      ELSE
        v_choice := 'replace';
      END IF;

      IF v_choice = 'replace' THEN
        IF v_key = ANY(v_taken) THEN
          RAISE EXCEPTION 'CARRY_CHOICE_MISSING:%', v_key;
        END IF;
        v_taken := array_append(v_taken, v_key);
        v_plan := v_plan || jsonb_build_array(jsonb_build_object('id', v_pay.id, 'dest', v_dest_id));
      END IF;
    END LOOP;
  END IF;

  IF v_scholarships THEN
    SELECT COALESCE(array_agg(s.id), '{}') INTO v_dest_sch
    FROM public.section_enrollment_scholarships s
    WHERE s.student_id = p_student_id
      AND s.section_id = p_to_section_id
      AND s.is_active;

    FOR v_sch IN
      SELECT s.id, s.is_active
      FROM public.section_enrollment_scholarships s
      WHERE s.enrollment_id = ANY(p_from_enrollment_ids)
    LOOP
      IF v_sch.is_active AND COALESCE(array_length(v_dest_sch, 1), 0) > 0 THEN
        SELECT elem->>'choice' INTO v_choice
        FROM jsonb_array_elements(COALESCE(p_choices, '[]'::JSONB)) elem
        WHERE elem->>'originId' = v_sch.id::TEXT
        LIMIT 1;
        IF v_choice IS DISTINCT FROM 'leave' AND v_choice IS DISTINCT FROM 'replace' THEN
          RAISE EXCEPTION 'CARRY_CHOICE_MISSING:scholarship';
        END IF;
      ELSE
        v_choice := 'replace';
      END IF;
      IF v_choice = 'replace' THEN
        v_sch_moves := array_append(v_sch_moves, v_sch.id);
        IF v_sch.is_active THEN
          v_deactivate := v_dest_sch;
        END IF;
      END IF;
    END LOOP;
  END IF;

  UPDATE public.section_enrollments e
  SET status = 'transferred', updated_at = now()
  WHERE e.id = ANY(p_from_enrollment_ids)
    AND e.student_id = p_student_id
    AND e.status = 'active';
  GET DIAGNOSTICS v_moved = ROW_COUNT;
  IF v_moved <> v_from_count THEN
    RAISE EXCEPTION 'SECTION_MOVE_NOT_FOUND';
  END IF;

  IF p_also_transfer_enrollment_id IS NOT NULL
     AND NOT (p_also_transfer_enrollment_id = ANY(p_from_enrollment_ids)) THEN
    UPDATE public.section_enrollments e
    SET status = 'transferred', updated_at = now()
    WHERE e.id = p_also_transfer_enrollment_id
      AND e.student_id = p_student_id
      AND e.status = 'active';
  END IF;

  v_commit := public.academic_admin_section_enroll_commit(
    p_student_id,
    p_to_section_id,
    NULL,
    'transferred',
    p_allow_capacity_override,
    p_default_max_students
  );
  v_new_id := (v_commit->>'enrollment_id')::UUID;
  IF v_new_id IS NULL THEN
    RAISE EXCEPTION 'SECTION_MOVE_SAVE_FAILED';
  END IF;

  FOR v_elem IN SELECT jsonb_array_elements(v_plan)
  LOOP
    v_origin := (v_elem->>'id')::UUID;
    v_dest_id := NULLIF(v_elem->>'dest', '')::UUID;
    IF v_dest_id IS NOT NULL THEN
      UPDATE public.payments
      SET superseded_at = now(),
          superseded_by_payment_id = v_origin,
          updated_at = now()
      WHERE id = v_dest_id
        AND superseded_at IS NULL;
    END IF;
    UPDATE public.payments
    SET section_id = p_to_section_id, updated_at = now()
    WHERE id = v_origin
      AND superseded_at IS NULL;
  END LOOP;

  IF COALESCE(array_length(v_deactivate, 1), 0) > 0 THEN
    UPDATE public.section_enrollment_scholarships
    SET is_active = false, updated_at = now()
    WHERE id = ANY(v_deactivate);
  END IF;

  IF COALESCE(array_length(v_sch_moves, 1), 0) > 0 THEN
    UPDATE public.section_enrollment_scholarships
    SET enrollment_id = v_new_id, section_id = p_to_section_id, updated_at = now()
    WHERE id = ANY(v_sch_moves);
  END IF;

  IF v_fee AND v_from_count > 0 THEN
    SELECT e.* INTO v_fee_row
    FROM public.section_enrollments e
    WHERE e.id = ANY(p_from_enrollment_ids)
    ORDER BY (e.enrollment_fee_exempt OR e.last_enrollment_paid_at IS NOT NULL) DESC, e.created_at DESC
    LIMIT 1;
    IF FOUND THEN
      UPDATE public.section_enrollments
      SET enrollment_fee_exempt = v_fee_row.enrollment_fee_exempt,
          enrollment_exempt_reason = v_fee_row.enrollment_exempt_reason,
          enrollment_fee_receipt_url = v_fee_row.enrollment_fee_receipt_url,
          enrollment_fee_receipt_status = v_fee_row.enrollment_fee_receipt_status,
          last_enrollment_paid_at = v_fee_row.last_enrollment_paid_at,
          enrollment_fee_paid_method = v_fee_row.enrollment_fee_paid_method,
          enrollment_fee_paid_on = v_fee_row.enrollment_fee_paid_on
      WHERE id = v_new_id;
      UPDATE public.section_enrollments
      SET enrollment_fee_exempt = false,
          enrollment_exempt_reason = NULL,
          enrollment_fee_receipt_url = NULL,
          enrollment_fee_receipt_status = NULL,
          last_enrollment_paid_at = NULL,
          enrollment_fee_paid_method = NULL,
          enrollment_fee_paid_on = NULL
      WHERE id = ANY(p_from_enrollment_ids);
    END IF;
  END IF;

  IF v_annual THEN
    UPDATE public.section_enrollment_annual_settlements
    SET enrollment_id = v_new_id, section_id = p_to_section_id
    WHERE enrollment_id = ANY(p_from_enrollment_ids);
  END IF;

  IF v_attendance THEN
    UPDATE public.section_attendance
    SET enrollment_id = v_new_id
    WHERE enrollment_id = ANY(p_from_enrollment_ids);
  END IF;

  IF v_grades THEN
    UPDATE public.section_grades
    SET enrollment_id = v_new_id
    WHERE enrollment_id = ANY(p_from_enrollment_ids);
    UPDATE public.enrollment_assessment_grades
    SET enrollment_id = v_new_id
    WHERE enrollment_id = ANY(p_from_enrollment_ids);
  END IF;

  RETURN jsonb_build_object('ok', true, 'enrollment_id', v_new_id::TEXT);
END;
$$;

GRANT EXECUTE ON FUNCTION public.move_student_section_with_carry(
  UUID, UUID, UUID[], UUID, BOOLEAN, INT, JSONB, JSONB
) TO authenticated;
