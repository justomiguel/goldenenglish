-- Academic RLS: tutor_student_rel replaced parent_student in migration 011.
-- Restores parent/tutor visibility for sections, enrollments, and transfer outcomes.

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

DROP POLICY IF EXISTS section_transfer_requests_select ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_select ON public.section_transfer_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR requested_by = auth.uid()
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = section_transfer_requests.student_id
    )
  );
