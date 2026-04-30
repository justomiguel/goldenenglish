-- Allow tutors to read badge grants of their linked students (read-only).
-- Extends the original student-only policy from 078_student_badges.sql so that
-- the parent/tutor dashboard can display a ward's achievements.

DROP POLICY IF EXISTS student_badge_grants_select_own ON public.student_badge_grants;

CREATE POLICY student_badge_grants_select_own ON public.student_badge_grants
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND ts.student_id = student_badge_grants.student_id
    )
  );

-- Allow tutors to read question bank items for sections their wards are enrolled in.
-- Extends the existing policy so the parent assessments (read-only) page works.

DROP POLICY IF EXISTS question_bank_items_select_scope ON public.question_bank_items;

CREATE POLICY question_bank_items_select_scope ON public.question_bank_items
  FOR SELECT TO authenticated
  USING (
    visibility = 'global'
    OR public.learning_route_staff_can_manage_section(auth.uid(), section_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = question_bank_items.section_id
        AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      JOIN public.tutor_student_rel ts ON ts.student_id = e.student_id
      WHERE e.section_id = question_bank_items.section_id
        AND ts.tutor_id = auth.uid()
    )
  );
