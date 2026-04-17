-- Fix: infinite recursion in policy for relation "academic_sections" (42P17).
--
-- peer-teacher visibility used:
--   EXISTS (SELECT 1 FROM public.academic_sections mine WHERE mine.cohort_id = academic_sections.cohort_id ...)
-- which re-evaluates RLS on academic_sections for the inner rows → infinite recursion.
--
-- Solution: SECURITY DEFINER helper (same pattern as user_has_role for profiles in 017_fix_profiles_rls_recursion.sql).

CREATE OR REPLACE FUNCTION public.teacher_teaches_cohort(p_teacher_id uuid, p_cohort_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.teacher_id = p_teacher_id
  );
$$;

COMMENT ON FUNCTION public.teacher_teaches_cohort(uuid, uuid) IS
  'SECURITY DEFINER: cohort/s teacher membership without re-entering academic_sections RLS.';

GRANT EXECUTE ON FUNCTION public.teacher_teaches_cohort(uuid, uuid) TO authenticated;

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
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.teacher_teaches_cohort(auth.uid(), academic_sections.cohort_id)
    )
  );
