-- Section lead (teacher_id) remains the canonical owner; optional assistants (same cohort tools).
-- RLS: assistants read sections/enrollments like the lead where policies used section_teacher_id / teacher-only checks.

CREATE TABLE IF NOT EXISTS public.academic_section_assistants (
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT academic_section_assistants_pkey PRIMARY KEY (section_id, assistant_id)
);

CREATE INDEX IF NOT EXISTS academic_section_assistants_assistant_idx
  ON public.academic_section_assistants (assistant_id);

COMMENT ON TABLE public.academic_section_assistants IS
  'Additional teachers with access to the section roster, attendance, and grades (not the lead teacher_id).';

ALTER TABLE public.academic_section_assistants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_section_assistants_select_scope ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_select_scope ON public.academic_section_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR assistant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS academic_section_assistants_admin_insert ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_admin_insert ON public.academic_section_assistants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_section_assistants_admin_delete ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_admin_delete ON public.academic_section_assistants
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Lead or assistant: used in enrollment / transfer policies (avoids recursion on academic_sections).
CREATE OR REPLACE FUNCTION public.user_leads_or_assists_section(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academic_sections s
    WHERE s.id = p_section_id AND s.teacher_id = p_uid
  )
  OR EXISTS (
    SELECT 1 FROM public.academic_section_assistants a
    WHERE a.section_id = p_section_id AND a.assistant_id = p_uid
  );
$$;

COMMENT ON FUNCTION public.user_leads_or_assists_section(uuid, uuid) IS
  'True if the user is the section lead teacher or listed as an assistant (SECURITY DEFINER; bypasses section RLS).';

GRANT EXECUTE ON FUNCTION public.user_leads_or_assists_section(uuid, uuid) TO authenticated;

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
  );

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.user_has_role(auth.uid(), 'teacher')
    AND public.user_leads_or_assists_section(auth.uid(), from_section_id)
  );

-- Section reads: assistants see active sections they assist (same non-admin rules as lead).
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
      )
    )
  );

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
      AND s.archived_at IS NULL
      AND (
        s.teacher_id = p_teacher_id
        OR EXISTS (
          SELECT 1 FROM public.academic_section_assistants a
          WHERE a.section_id = s.id AND a.assistant_id = p_teacher_id
        )
      )
  );
$$;

-- Attendance / grades: assistants may read/write rows for enrollments in sections they assist.
CREATE OR REPLACE FUNCTION public.section_enrollment_teacher_is_self(p_enrollment_id UUID)
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
      AND (
        s.teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.academic_section_assistants a
          WHERE a.section_id = s.id AND a.assistant_id = auth.uid()
        )
      )
  );
$$;
