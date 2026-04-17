-- Allow teachers to delete attendance rows they recorded within the same operational window as insert/update,
-- so the client can offer a safe "undo" after a column bulk-fill of empty cells.

DROP POLICY IF EXISTS section_attendance_teacher_delete ON public.section_attendance;
CREATE POLICY section_attendance_teacher_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );
