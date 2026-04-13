-- Operational attendance: configurable no-class days + teacher edit window (RLS).

CREATE TABLE IF NOT EXISTS public.academic_no_class_days (
  on_date DATE PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.academic_no_class_days IS
  'Calendar days without regular classes (holidays). Admins maintain; teachers see warnings in UI.';

ALTER TABLE public.academic_no_class_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_no_class_days_select ON public.academic_no_class_days;
CREATE POLICY academic_no_class_days_select ON public.academic_no_class_days
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS academic_no_class_days_admin_write ON public.academic_no_class_days;
CREATE POLICY academic_no_class_days_admin_write ON public.academic_no_class_days
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Teachers may only insert/update attendance for the last ~48h window (inclusive: today and two prior calendar days).
DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
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
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );
