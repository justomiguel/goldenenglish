-- Operational soft-archive for cohorts and sections (admin-driven "baja").
-- Non-admin readers lose visibility; public registration helpers ignore archived rows.

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS academic_cohorts_archived_idx
  ON public.academic_cohorts (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS academic_sections_archived_idx
  ON public.academic_sections (archived_at)
  WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN public.academic_cohorts.archived_at IS
  'When set, cohort is hidden from non-admin operational reads until restored.';

COMMENT ON COLUMN public.academic_sections.archived_at IS
  'When set, section is hidden from non-admin operational reads until restored.';

-- Peer-teacher cohort visibility: only active (non-archived) sections count.
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
      AND s.teacher_id = p_teacher_id
      AND s.archived_at IS NULL
  );
$$;

-- Public registration options: current cohort only, both cohort and section active.
CREATE OR REPLACE FUNCTION public.list_registration_section_options()
RETURNS TABLE (id uuid, label text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         c.name || ' — ' || s.name AS label
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE c.is_current = true
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
  ORDER BY c.name, s.name;
$$;

CREATE OR REPLACE FUNCTION public.registration_public_section_label(p_section_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name || ' — ' || s.name
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE s.id = p_section_id
    AND c.is_current = true
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
  LIMIT 1;
$$;

-- Authenticated cohort reads: admins see everything; others only non-archived cohorts.
DROP POLICY IF EXISTS academic_cohorts_select_auth ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_auth ON public.academic_cohorts
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.academic_cohorts.archived_at IS NULL
  );

-- Anon public registration: current + not archived.
DROP POLICY IF EXISTS academic_cohorts_select_public_current ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_public_current ON public.academic_cohorts
  FOR SELECT TO anon
  USING (is_current = true AND archived_at IS NULL);

DROP POLICY IF EXISTS academic_sections_select_public_registration ON public.academic_sections;
CREATE POLICY academic_sections_select_public_registration ON public.academic_sections
  FOR SELECT TO anon
  USING (
    academic_sections.archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.academic_cohorts c
      WHERE c.id = academic_sections.cohort_id
        AND c.is_current = true
        AND c.archived_at IS NULL
    )
  );

-- Section reads: admins bypass archive; everyone else only non-archived sections.
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
