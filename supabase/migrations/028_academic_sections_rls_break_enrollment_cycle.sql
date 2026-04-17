-- Fix 42P17: second recursion cycle between academic_sections and section_enrollments.
--
-- academic_sections_select_scope uses EXISTS (section_enrollments …).
-- section_enrollments_select_scope used EXISTS (academic_sections s WHERE s.id = section_id …).
-- Those mutual subqueries re-enter RLS → infinite recursion (even when enrollment count is 0,
-- the planner still ties the policies together).
--
-- section_transfer_requests_teacher_insert also used EXISTS (academic_sections …) and can feed the same cycle.
--
-- cohort_assessments_teacher_insert: replace direct EXISTS on academic_sections with teacher_teaches_cohort
-- (from 027) to avoid redundant self-joins in policies.

CREATE OR REPLACE FUNCTION public.section_teacher_id(p_section_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.teacher_id
  FROM public.academic_sections s
  WHERE s.id = p_section_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.section_teacher_id(uuid) IS
  'SECURITY DEFINER: read academic_sections.teacher_id without enrollment/section RLS ping-pong.';

GRANT EXECUTE ON FUNCTION public.section_teacher_id(uuid) TO authenticated;

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
    OR public.section_teacher_id(section_enrollments.section_id) = auth.uid()
  );

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.user_has_role(auth.uid(), 'teacher')
    AND public.section_teacher_id(from_section_id) = auth.uid()
  );

DROP POLICY IF EXISTS cohort_assessments_teacher_insert ON public.cohort_assessments;
CREATE POLICY cohort_assessments_teacher_insert ON public.cohort_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_role(auth.uid(), 'teacher')
    AND public.teacher_teaches_cohort(auth.uid(), cohort_assessments.cohort_id)
  );
