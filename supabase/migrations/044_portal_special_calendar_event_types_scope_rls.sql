-- Portal special calendar: closed event types, visibility scope, meeting URL, scoped SELECT RLS.

ALTER TABLE public.portal_special_calendar_events
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'social',
  ADD COLUMN IF NOT EXISTS calendar_scope TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS cohort_id UUID NULL REFERENCES public.academic_cohorts (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS section_id UUID NULL REFERENCES public.academic_sections (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS meeting_url TEXT NULL;

ALTER TABLE public.portal_special_calendar_events
  DROP CONSTRAINT IF EXISTS portal_special_calendar_events_event_type_chk;

ALTER TABLE public.portal_special_calendar_events
  ADD CONSTRAINT portal_special_calendar_events_event_type_chk CHECK (
    event_type IN (
      'holiday',
      'institutional_exam',
      'parent_meeting',
      'social',
      'trimester_admin'
    )
  );

ALTER TABLE public.portal_special_calendar_events
  DROP CONSTRAINT IF EXISTS portal_special_calendar_events_scope_chk;

ALTER TABLE public.portal_special_calendar_events
  ADD CONSTRAINT portal_special_calendar_events_scope_chk CHECK (
    (calendar_scope = 'global' AND cohort_id IS NULL AND section_id IS NULL)
    OR (calendar_scope = 'cohort' AND cohort_id IS NOT NULL AND section_id IS NULL)
    OR (calendar_scope = 'section' AND section_id IS NOT NULL AND cohort_id IS NULL)
  );

COMMENT ON COLUMN public.portal_special_calendar_events.event_type IS
  'Closed catalog: holiday, institutional_exam, parent_meeting, social, trimester_admin.';

COMMENT ON COLUMN public.portal_special_calendar_events.calendar_scope IS
  'Visibility scope: global (institute), cohort (single cohort), or section (single section).';

CREATE INDEX IF NOT EXISTS portal_special_calendar_events_cohort_idx
  ON public.portal_special_calendar_events (cohort_id)
  WHERE cohort_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_special_calendar_events_section_idx
  ON public.portal_special_calendar_events (section_id)
  WHERE section_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.portal_special_calendar_row_visible(
  p_viewer uuid,
  p_event_type text,
  p_calendar_scope text,
  p_cohort_id uuid,
  p_section_id uuid
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF public.is_admin(p_viewer) THEN
    RETURN true;
  END IF;

  SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = p_viewer;
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  IF p_event_type = 'parent_meeting' THEN
    IF v_role = 'student' THEN
      RETURN false;
    END IF;

    IF v_role = 'parent' THEN
      IF p_calendar_scope = 'global' THEN
        RETURN true;
      ELSIF p_calendar_scope = 'cohort' AND p_cohort_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1
          FROM public.tutor_student_rel tsr
          JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
          JOIN public.academic_sections s ON s.id = se.section_id AND s.archived_at IS NULL
          WHERE tsr.tutor_id = p_viewer AND s.cohort_id = p_cohort_id
        );
      ELSIF p_calendar_scope = 'section' AND p_section_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1
          FROM public.tutor_student_rel tsr
          JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
          WHERE tsr.tutor_id = p_viewer AND se.section_id = p_section_id
        );
      END IF;
      RETURN false;
    END IF;

    IF v_role IN ('teacher', 'assistant') THEN
      IF p_calendar_scope <> 'section' OR p_section_id IS NULL THEN
        RETURN false;
      END IF;
      RETURN EXISTS (
        SELECT 1
        FROM public.academic_sections s
        WHERE s.id = p_section_id
          AND s.archived_at IS NULL
          AND (
            s.teacher_id = p_viewer
            OR EXISTS (
              SELECT 1 FROM public.academic_section_assistants a
              WHERE a.section_id = s.id AND a.assistant_id = p_viewer
            )
          )
      );
    END IF;

    RETURN false;
  END IF;

  IF p_calendar_scope = 'global' THEN
    RETURN true;
  END IF;

  IF p_calendar_scope = 'cohort' AND p_cohort_id IS NOT NULL THEN
    IF v_role = 'student' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.section_enrollments se
        JOIN public.academic_sections s ON s.id = se.section_id AND s.archived_at IS NULL
        WHERE se.student_id = p_viewer AND se.status = 'active' AND s.cohort_id = p_cohort_id
      );
    END IF;

    IF v_role = 'parent' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.tutor_student_rel tsr
        JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
        JOIN public.academic_sections s ON s.id = se.section_id AND s.archived_at IS NULL
        WHERE tsr.tutor_id = p_viewer AND s.cohort_id = p_cohort_id
      );
    END IF;

    IF v_role IN ('teacher', 'assistant') THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.academic_sections s
        WHERE s.cohort_id = p_cohort_id
          AND s.archived_at IS NULL
          AND (
            s.teacher_id = p_viewer
            OR EXISTS (
              SELECT 1 FROM public.academic_section_assistants a
              WHERE a.section_id = s.id AND a.assistant_id = p_viewer
            )
          )
      );
    END IF;

    RETURN false;
  END IF;

  IF p_calendar_scope = 'section' AND p_section_id IS NOT NULL THEN
    IF v_role = 'student' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.section_enrollments se
        WHERE se.student_id = p_viewer AND se.status = 'active' AND se.section_id = p_section_id
      );
    END IF;

    IF v_role = 'parent' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.tutor_student_rel tsr
        JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
        WHERE tsr.tutor_id = p_viewer AND se.section_id = p_section_id
      );
    END IF;

    IF v_role IN ('teacher', 'assistant') THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.academic_sections s
        WHERE s.id = p_section_id
          AND s.archived_at IS NULL
          AND (
            s.teacher_id = p_viewer
            OR EXISTS (
              SELECT 1 FROM public.academic_section_assistants a
              WHERE a.section_id = s.id AND a.assistant_id = p_viewer
            )
          )
      );
    END IF;

    RETURN false;
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS portal_special_calendar_events_select_auth ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_select_scoped
  ON public.portal_special_calendar_events
  FOR SELECT TO authenticated
  USING (
    public.portal_special_calendar_row_visible(
      auth.uid(),
      event_type,
      calendar_scope,
      cohort_id,
      section_id
    )
  );

COMMENT ON FUNCTION public.portal_special_calendar_row_visible(uuid, text, text, uuid, uuid) IS
  'RLS helper: visibility by role, event_type, and calendar_scope (mirrors app-side filter for feed).';
