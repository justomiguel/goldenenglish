-- Cohort-level assessments + per-enrollment rubric grades (draft / published).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_assessment_grade_status') THEN
    CREATE TYPE public.enrollment_assessment_grade_status AS ENUM ('draft', 'published');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cohort_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.academic_cohorts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assessment_on DATE NOT NULL,
  max_score NUMERIC(6, 2) NOT NULL CHECK (max_score > 0 AND max_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cohort_assessments_cohort_idx
  ON public.cohort_assessments (cohort_id, assessment_on DESC);

CREATE TABLE IF NOT EXISTS public.enrollment_assessment_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.cohort_assessments (id) ON DELETE CASCADE,
  score NUMERIC(6, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  rubric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  teacher_feedback TEXT,
  status public.enrollment_assessment_grade_status NOT NULL DEFAULT 'draft',
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollment_assessment_grades_uidx UNIQUE (enrollment_id, assessment_id)
);

CREATE INDEX IF NOT EXISTS enrollment_assessment_grades_assessment_idx
  ON public.enrollment_assessment_grades (assessment_id, status);

DROP TRIGGER IF EXISTS enrollment_assessment_grades_set_updated_at ON public.enrollment_assessment_grades;
CREATE TRIGGER enrollment_assessment_grades_set_updated_at
  BEFORE UPDATE ON public.enrollment_assessment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.cohort_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_assessment_grades ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enrollment_assessment_in_teacher_cohort(p_enrollment_id UUID, p_assessment_id UUID)
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
    JOIN public.cohort_assessments a ON a.cohort_id = s.cohort_id
    WHERE e.id = p_enrollment_id
      AND a.id = p_assessment_id
      AND s.teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.cohort_assessment_teacher_can_see(p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cohort_assessments ca
    JOIN public.academic_sections s ON s.cohort_id = ca.cohort_id
    WHERE ca.id = p_assessment_id
      AND s.teacher_id = auth.uid()
  );
$$;

-- cohort_assessments
DROP POLICY IF EXISTS cohort_assessments_select_scope ON public.cohort_assessments;
CREATE POLICY cohort_assessments_select_scope ON public.cohort_assessments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.cohort_assessment_teacher_can_see(id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      JOIN public.academic_sections s ON s.id = e.section_id
      WHERE s.cohort_id = cohort_assessments.cohort_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS cohort_assessments_admin_write ON public.cohort_assessments;
CREATE POLICY cohort_assessments_admin_write ON public.cohort_assessments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS cohort_assessments_teacher_insert ON public.cohort_assessments;
CREATE POLICY cohort_assessments_teacher_insert ON public.cohort_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.cohort_id = cohort_assessments.cohort_id
        AND s.teacher_id = auth.uid()
    )
  );

-- enrollment_assessment_grades
DROP POLICY IF EXISTS enrollment_assessment_grades_select_scope ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_select_scope ON public.enrollment_assessment_grades
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = enrollment_assessment_grades.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS enrollment_assessment_grades_teacher_insert ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_teacher_insert ON public.enrollment_assessment_grades
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.enrollment_assessment_in_teacher_cohort(enrollment_id, assessment_id)
      AND updated_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS enrollment_assessment_grades_teacher_update ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_teacher_update ON public.enrollment_assessment_grades
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.enrollment_assessment_in_teacher_cohort(enrollment_id, assessment_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.enrollment_assessment_in_teacher_cohort(enrollment_id, assessment_id));

DROP POLICY IF EXISTS enrollment_assessment_grades_admin_delete ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_admin_delete ON public.enrollment_assessment_grades
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
