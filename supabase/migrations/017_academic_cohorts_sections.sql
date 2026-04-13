-- Academic cohorts, sections (schedule JSON), section enrollments (historical statuses),
-- transfer requests (teacher -> admin). RPC for atomic enroll + optional drop.

DO $$
BEGIN
  CREATE TYPE public.section_enrollment_status AS ENUM (
    'active',
    'completed',
    'transferred',
    'dropped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.section_transfer_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.academic_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.academic_cohorts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  schedule_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_students INT NULL CHECK (max_students IS NULL OR max_students > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academic_sections_cohort_idx
  ON public.academic_sections (cohort_id);
CREATE INDEX IF NOT EXISTS academic_sections_teacher_idx
  ON public.academic_sections (teacher_id);

CREATE TABLE IF NOT EXISTS public.section_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.section_enrollment_status NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS section_enrollments_active_unique
  ON public.section_enrollments (section_id, student_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS section_enrollments_student_idx
  ON public.section_enrollments (student_id);
CREATE INDEX IF NOT EXISTS section_enrollments_section_idx
  ON public.section_enrollments (section_id);

CREATE TABLE IF NOT EXISTS public.section_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  from_section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  to_section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.section_transfer_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_transfer_requests_distinct_sections
    CHECK (from_section_id <> to_section_id)
);

CREATE INDEX IF NOT EXISTS section_transfer_requests_status_idx
  ON public.section_transfer_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS academic_cohorts_set_updated_at ON public.academic_cohorts;
CREATE TRIGGER academic_cohorts_set_updated_at
  BEFORE UPDATE ON public.academic_cohorts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS academic_sections_set_updated_at ON public.academic_sections;
CREATE TRIGGER academic_sections_set_updated_at
  BEFORE UPDATE ON public.academic_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS section_enrollments_set_updated_at ON public.section_enrollments;
CREATE TRIGGER section_enrollments_set_updated_at
  BEFORE UPDATE ON public.section_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Schedule overlap (JSON arrays of { dayOfWeek, startTime, endTime } strings)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.academic_time_to_minutes(t TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (split_part(trim(t), ':', 1))::INT * 60
    + NULLIF(trim(split_part(trim(t), ':', 2)), '')::INT,
    -1
  );
$$;

CREATE OR REPLACE FUNCTION public.academic_json_slots_overlap(a JSONB, b JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  xa JSONB;
  xb JSONB;
  da INT;
  db INT;
  sa INT;
  ea INT;
  sb INT;
  eb INT;
BEGIN
  IF a IS NULL OR b IS NULL THEN
    RETURN false;
  END IF;
  FOR xa IN SELECT jsonb_array_elements(COALESCE(a, '[]'::jsonb))
  LOOP
    da := COALESCE((xa ->> 'dayOfWeek')::INT, -1);
    sa := public.academic_time_to_minutes(xa ->> 'startTime');
    ea := public.academic_time_to_minutes(xa ->> 'endTime');
    IF da < 0 OR sa < 0 OR ea < 0 OR sa >= ea THEN
      CONTINUE;
    END IF;
    FOR xb IN SELECT jsonb_array_elements(COALESCE(b, '[]'::jsonb))
    LOOP
      db := COALESCE((xb ->> 'dayOfWeek')::INT, -1);
      sb := public.academic_time_to_minutes(xb ->> 'startTime');
      eb := public.academic_time_to_minutes(xb ->> 'endTime');
      IF db < 0 OR sb < 0 OR eb < 0 OR sb >= eb THEN
        CONTINUE;
      END IF;
      IF da = db AND sa < eb AND sb < ea THEN
        RETURN true;
      END IF;
    END LOOP;
  END LOOP;
  RETURN false;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic admin enroll (+ optional drop active row) with capacity + overlap
-- ---------------------------------------------------------------------------
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

  SELECT schedule_slots, COALESCE(max_students, p_default_max_students)
  INTO v_target_slots, v_max
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

GRANT EXECUTE ON FUNCTION public.academic_admin_section_enroll_commit(
  UUID, UUID, UUID, TEXT, BOOLEAN, INT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.academic_json_slots_overlap(JSONB, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.academic_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_transfer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_cohorts_select_auth ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_auth ON public.academic_cohorts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS academic_cohorts_admin_write ON public.academic_cohorts;
CREATE POLICY academic_cohorts_admin_write ON public.academic_cohorts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = academic_sections.id
        AND e.status = 'active'
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS academic_sections_admin_write ON public.academic_sections;
CREATE POLICY academic_sections_admin_write ON public.academic_sections
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_enrollments_select_scope ON public.section_enrollments;
CREATE POLICY section_enrollments_select_scope ON public.section_enrollments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = section_enrollments.student_id
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_enrollments.section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_enrollments_admin_write ON public.section_enrollments;
CREATE POLICY section_enrollments_admin_write ON public.section_enrollments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_transfer_requests_select ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_select ON public.section_transfer_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR requested_by = auth.uid()
  );

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = from_section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_transfer_requests_admin_update ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_admin_update ON public.section_transfer_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_transfer_requests_admin_delete ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_admin_delete ON public.section_transfer_requests
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
