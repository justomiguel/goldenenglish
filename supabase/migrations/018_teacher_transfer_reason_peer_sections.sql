-- Structured reason for transfer metrics + teacher read of peer sections in same cohort
-- (so a teacher can suggest moves to another section they do not teach).

ALTER TABLE public.section_transfer_requests
  ADD COLUMN IF NOT EXISTS reason_code text;

COMMENT ON COLUMN public.section_transfer_requests.reason_code IS
  'Teacher suggestion category: academic_level, schedule, behavior, other (validated in app).';

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
    OR EXISTS (
      SELECT 1 FROM public.academic_sections mine
      WHERE mine.cohort_id = academic_sections.cohort_id
        AND mine.teacher_id = auth.uid()
        AND public.user_has_role(auth.uid(), 'teacher')
    )
  );
