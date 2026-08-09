-- Family reads of cohort assessments time out under RLS.
--
-- `cohort_assessments_select_scope` resolved both of its non-admin branches by re-entering
-- RLS-protected tables. The teacher branch calls a SECURITY INVOKER helper that selects from
-- `cohort_assessments` — the very relation being filtered — and the family branch joins
-- `section_enrollments` with `academic_sections`, whose policies reference each other.
--
-- Measured with the session of a real tutor: selecting `cohort_assessments` by `cohort_id` is
-- cancelled by `statement_timeout` on a table holding a single row, while the same query under the
-- service role returns instantly. The parent Progress screen renders that timeout as "no data", so
-- the Exams and Feedback sections disappear instead of failing visibly.
--
-- Both branches keep exactly the predicate they had. Only the evaluation escapes the cycle:
-- SECURITY DEFINER stops the nested reads from re-applying the policies that caused it, and
-- `auth.uid()` becomes an initplan instead of a per-row call.

-- Same teacher predicate as before; DEFINER so the policy no longer re-enters its own relation.
CREATE OR REPLACE FUNCTION public.cohort_assessment_teacher_can_see(p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
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

COMMENT ON FUNCTION public.cohort_assessment_teacher_can_see(uuid) IS
  'SECURITY DEFINER: unchanged teacher predicate, without re-entering cohort_assessments RLS from its own policy.';

GRANT EXECUTE ON FUNCTION public.cohort_assessment_teacher_can_see(uuid) TO authenticated;

-- The student themself, or a tutor linked to a student, enrolled in any section of the cohort.
CREATE OR REPLACE FUNCTION public.user_is_family_of_cohort(p_user UUID, p_cohort_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE s.cohort_id = p_cohort_id
      AND (
        e.student_id = p_user
        OR EXISTS (
          SELECT 1
          FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = p_user
            AND ts.student_id = e.student_id
        )
      )
  );
$$;

COMMENT ON FUNCTION public.user_is_family_of_cohort(uuid, uuid) IS
  'SECURITY DEFINER: student-or-tutor membership of a cohort, without the academic_sections <-> section_enrollments RLS cycle.';

GRANT EXECUTE ON FUNCTION public.user_is_family_of_cohort(uuid, uuid) TO authenticated;

-- The tutor lookup inside the helper filters on tutor_id; only the student side was indexed.
CREATE INDEX IF NOT EXISTS tutor_student_rel_tutor_student_idx
  ON public.tutor_student_rel (tutor_id, student_id);

DROP POLICY IF EXISTS cohort_assessments_select_scope ON public.cohort_assessments;
CREATE POLICY cohort_assessments_select_scope ON public.cohort_assessments
  FOR SELECT TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR public.cohort_assessment_teacher_can_see(id)
    OR public.user_is_family_of_cohort((SELECT auth.uid()), cohort_id)
  );
