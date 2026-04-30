-- Teacher/staff portal attendance: widen write window to the institute calendar (aligned with app
-- `getInstituteTimeZone` / analytics) instead of PostgreSQL CURRENT_DATE and “last 2 days”.
-- Upper bound: no marks after institute-local “today”. Lower: wide bounded lookback so RLS does not
-- contradict app rules that allow any attended_on from section start (see adminAttendanceMatrixEffMinIso).

DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
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
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );
