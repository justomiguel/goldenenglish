-- Schedule overlap applies inside one cohort. Another cohort is another year.
-- A copied student keeps the source enrollment and can share a weekday hour there.

CREATE OR REPLACE FUNCTION public.academic_admin_section_enroll_commit(
  p_student_id UUID,
  p_section_id UUID,
  p_drop_section_enrollment_id UUID,
  p_drop_next_status TEXT,
  p_allow_capacity_override BOOLEAN,
  p_default_max_students INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_max INT;
  v_cnt INT;
  v_target_slots JSONB;
  v_cohort UUID;
  v_row RECORD;
  v_new_id UUID;
  v_next public.section_enrollment_status;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ACADEMIC_NOT_ADMIN';
  END IF;

  IF p_default_max_students IS NULL OR p_default_max_students < 1 THEN
    RAISE EXCEPTION 'ACADEMIC_BAD_DEFAULT_MAX';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.section_enrollments e
    WHERE e.section_id = p_section_id
      AND e.student_id = p_student_id
      AND e.status = 'active'
      AND (
        p_drop_section_enrollment_id IS NULL
        OR e.id <> p_drop_section_enrollment_id
      )
  ) THEN
    RAISE EXCEPTION 'ACADEMIC_ALREADY_ACTIVE_IN_SECTION';
  END IF;

  SELECT schedule_slots, cohort_id, COALESCE(max_students, p_default_max_students)
  INTO v_target_slots, v_cohort, v_max
  FROM public.academic_sections
  WHERE id = p_section_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACADEMIC_SECTION_NOT_FOUND';
  END IF;

  SELECT count(*)::INT
  INTO v_cnt
  FROM public.section_enrollments
  WHERE section_id = p_section_id AND status = 'active';

  IF v_cnt >= v_max AND NOT COALESCE(p_allow_capacity_override, false) THEN
    RAISE EXCEPTION 'ACADEMIC_CAPACITY_EXCEEDED';
  END IF;

  IF p_drop_section_enrollment_id IS NOT NULL THEN
    IF lower(COALESCE(p_drop_next_status, 'dropped')) = 'transferred' THEN
      v_next := 'transferred';
    ELSE
      v_next := 'dropped';
    END IF;

    UPDATE public.section_enrollments e
    SET status = v_next, updated_at = now()
    WHERE e.id = p_drop_section_enrollment_id
      AND e.student_id = p_student_id
      AND e.status = 'active';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACADEMIC_DROP_INVALID';
    END IF;
  END IF;

  FOR v_row IN
    SELECT s.schedule_slots AS slots
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE e.student_id = p_student_id
      AND e.status = 'active'
      AND e.section_id <> p_section_id
      AND s.cohort_id = v_cohort
      AND (
        p_drop_section_enrollment_id IS NULL
        OR e.id <> p_drop_section_enrollment_id
      )
  LOOP
    IF public.academic_json_slots_overlap(v_target_slots, v_row.slots) THEN
      RAISE EXCEPTION 'ACADEMIC_SCHEDULE_OVERLAP';
    END IF;
  END LOOP;

  INSERT INTO public.section_enrollments (section_id, student_id, status)
  VALUES (p_section_id, p_student_id, 'active')
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'enrollment_id', v_new_id::text);
END;
$$;
