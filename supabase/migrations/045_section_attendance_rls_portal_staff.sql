-- Attendance writes were gated on user_has_role(..., 'teacher') while the app allows
-- lead teachers, staff assistants, and student assistants (section_enrollment_teacher_is_self).
-- Drop the role check; enrollment+section membership already scopes writes.

DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_delete ON public.section_attendance;
CREATE POLICY section_attendance_teacher_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );
