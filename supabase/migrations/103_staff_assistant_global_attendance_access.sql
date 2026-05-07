-- Staff profiles with role `assistant` may take section attendance on any non-archived class
-- without a row in academic_section_assistants. Scoped to attendance RLS + section/enrollment reads
-- required for the matrix (does not widen section_enrollment_teacher_is_self elsewhere).

-- Helper: check if a section exists and is not archived, bypassing RLS recursion cycle.
CREATE OR REPLACE FUNCTION public.section_is_non_archived_for_rls(p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academic_sections s
    WHERE s.id = p_section_id
      AND s.archived_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.section_is_non_archived_for_rls(uuid) IS
  'SECURITY DEFINER: section exists and is not archived, without enrollment/section RLS ping-pong.';

GRANT EXECUTE ON FUNCTION public.section_is_non_archived_for_rls(uuid) TO authenticated;

-- Helper: check if an enrollment belongs to a non-archived section and the caller is staff assistant.
CREATE OR REPLACE FUNCTION public.section_enrollment_global_staff_assistant_for_attendance(
  p_enrollment_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE e.id = p_enrollment_id
      AND s.archived_at IS NULL
      AND public.user_has_role(auth.uid(), 'assistant')
  );
$$;

COMMENT ON FUNCTION public.section_enrollment_global_staff_assistant_for_attendance(UUID) IS
  'True when the caller has profiles.role assistant and the enrollment belongs to a non-archived section; used only in section_attendance RLS (not retention or grades).';

GRANT EXECUTE ON FUNCTION public.section_enrollment_global_staff_assistant_for_attendance(UUID) TO authenticated;

-- Attendance SELECT: add global staff assistant path.
DROP POLICY IF EXISTS section_attendance_select_scope ON public.section_attendance;
CREATE POLICY section_attendance_select_scope ON public.section_attendance
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR public.section_enrollment_global_staff_assistant_for_attendance(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = section_attendance.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

-- Attendance INSERT
DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      (
        public.section_enrollment_teacher_is_self(enrollment_id)
        OR public.section_enrollment_global_staff_assistant_for_attendance(enrollment_id)
      )
      AND recorded_by = auth.uid()
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

-- Attendance UPDATE
DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      (
        public.section_enrollment_teacher_is_self(enrollment_id)
        OR public.section_enrollment_global_staff_assistant_for_attendance(enrollment_id)
      )
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      (
        public.section_enrollment_teacher_is_self(enrollment_id)
        OR public.section_enrollment_global_staff_assistant_for_attendance(enrollment_id)
      )
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

-- Attendance DELETE
DROP POLICY IF EXISTS section_attendance_teacher_delete ON public.section_attendance;
CREATE POLICY section_attendance_teacher_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      (
        public.section_enrollment_teacher_is_self(enrollment_id)
        OR public.section_enrollment_global_staff_assistant_for_attendance(enrollment_id)
      )
      AND recorded_by = auth.uid()
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

-- Section reads: add global staff assistant. Admin sees ALL (including archived).
DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      academic_sections.archived_at IS NULL
      AND (
        teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.academic_section_assistants a
          WHERE a.section_id = academic_sections.id
            AND a.assistant_id = auth.uid()
        )
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
        OR public.user_has_role(auth.uid(), 'assistant')
      )
    )
  );

-- Enrollment reads: assistant can see enrollments of non-archived sections.
-- Uses SECURITY DEFINER helper to avoid academic_sections ↔ section_enrollments RLS cycle.
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
    OR public.user_leads_or_assists_section(auth.uid(), section_enrollments.section_id)
    OR (
      public.user_has_role(auth.uid(), 'assistant')
      AND public.section_is_non_archived_for_rls(section_enrollments.section_id)
    )
  );

-- Profile reads: assistant can see student profiles (needed for attendance name labels).
-- No subquery to other RLS-protected tables — safe from recursion.
DROP POLICY IF EXISTS profiles_select_assistant_for_attendance ON public.profiles;
CREATE POLICY profiles_select_assistant_for_attendance ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'assistant')
    AND profiles.role = 'student'
  );
