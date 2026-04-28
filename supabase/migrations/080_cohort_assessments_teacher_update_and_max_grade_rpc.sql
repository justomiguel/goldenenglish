-- Teachers who teach the cohort (lead or section assistant) may update cohort_assessment rows.
-- RPC: max numeric score already stored for an assessment (for validating max_score decreases).

CREATE OR REPLACE FUNCTION public.max_enrollment_assessment_grade_score(p_assessment_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(g.score), 0::numeric)
  FROM public.enrollment_assessment_grades g
  WHERE g.assessment_id = p_assessment_id;
$$;

COMMENT ON FUNCTION public.max_enrollment_assessment_grade_score(uuid) IS
  'Highest stored score for a cohort assessment; used when lowering max_score.';

GRANT EXECUTE ON FUNCTION public.max_enrollment_assessment_grade_score(uuid) TO authenticated;

DROP POLICY IF EXISTS cohort_assessments_teacher_update ON public.cohort_assessments;
CREATE POLICY cohort_assessments_teacher_update ON public.cohort_assessments
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.teacher_teaches_cohort(auth.uid(), cohort_assessments.cohort_id)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.teacher_teaches_cohort(auth.uid(), cohort_assessments.cohort_id)
    )
  );
