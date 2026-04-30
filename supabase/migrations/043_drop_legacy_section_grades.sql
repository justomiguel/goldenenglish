-- Remove deprecated quick grades table superseded by cohort assessments.

DROP POLICY IF EXISTS section_grades_select_scope ON public.section_grades;
DROP POLICY IF EXISTS section_grades_teacher_insert ON public.section_grades;
DROP POLICY IF EXISTS section_grades_teacher_update ON public.section_grades;
DROP POLICY IF EXISTS section_grades_admin_delete ON public.section_grades;

DROP INDEX IF EXISTS public.section_grades_enrollment_idx;

DROP TABLE IF EXISTS public.section_grades;
