-- Section-scoped attendance & grades (per section_enrollment), retention alerts.
-- Distinct from legacy public.attendance (student_id + global date).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_attendance_status') THEN
    CREATE TYPE public.section_attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.section_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  attended_on DATE NOT NULL,
  status public.section_attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_attendance_enrollment_day_uidx UNIQUE (enrollment_id, attended_on)
);

CREATE INDEX IF NOT EXISTS section_attendance_section_day_idx
  ON public.section_attendance (enrollment_id, attended_on DESC);

CREATE TABLE IF NOT EXISTS public.section_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  score NUMERIC(6, 2) NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback_text TEXT,
  rubric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS section_grades_enrollment_idx
  ON public.section_grades (enrollment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.retention_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS retention_alerts_status_created_idx
  ON public.retention_alerts (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.enrollment_retention_flags (
  enrollment_id UUID PRIMARY KEY REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  watch BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS section_attendance_set_updated_at ON public.section_attendance;
CREATE TRIGGER section_attendance_set_updated_at
  BEFORE UPDATE ON public.section_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.section_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_retention_flags ENABLE ROW LEVEL SECURITY;

-- Helper: enrollment belongs to section taught by teacher
CREATE OR REPLACE FUNCTION public.section_enrollment_teacher_is_self(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE e.id = p_enrollment_id AND s.teacher_id = auth.uid()
  );
$$;

-- section_attendance
DROP POLICY IF EXISTS section_attendance_select_scope ON public.section_attendance;
CREATE POLICY section_attendance_select_scope ON public.section_attendance
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = section_attendance.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  );

DROP POLICY IF EXISTS section_attendance_admin_delete ON public.section_attendance;
CREATE POLICY section_attendance_admin_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- section_grades
DROP POLICY IF EXISTS section_grades_select_scope ON public.section_grades;
CREATE POLICY section_grades_select_scope ON public.section_grades
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = section_grades.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS section_grades_teacher_insert ON public.section_grades;
CREATE POLICY section_grades_teacher_insert ON public.section_grades
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_grades_teacher_update ON public.section_grades;
CREATE POLICY section_grades_teacher_update ON public.section_grades
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id));

DROP POLICY IF EXISTS section_grades_admin_delete ON public.section_grades;
CREATE POLICY section_grades_admin_delete ON public.section_grades
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- retention_alerts
DROP POLICY IF EXISTS retention_alerts_select ON public.retention_alerts;
CREATE POLICY retention_alerts_select ON public.retention_alerts
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = retention_alerts.student_id
    )
  );

DROP POLICY IF EXISTS retention_alerts_teacher_insert ON public.retention_alerts;
CREATE POLICY retention_alerts_teacher_insert ON public.retention_alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  );

DROP POLICY IF EXISTS retention_alerts_admin_update ON public.retention_alerts;
CREATE POLICY retention_alerts_admin_update ON public.retention_alerts
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- enrollment_retention_flags
DROP POLICY IF EXISTS enrollment_retention_flags_select ON public.enrollment_retention_flags;
CREATE POLICY enrollment_retention_flags_select ON public.enrollment_retention_flags
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
  );

DROP POLICY IF EXISTS enrollment_retention_flags_teacher_upsert ON public.enrollment_retention_flags;
CREATE POLICY enrollment_retention_flags_teacher_upsert ON public.enrollment_retention_flags
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  );

DROP POLICY IF EXISTS enrollment_retention_flags_teacher_update ON public.enrollment_retention_flags;
CREATE POLICY enrollment_retention_flags_teacher_update ON public.enrollment_retention_flags
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id));
