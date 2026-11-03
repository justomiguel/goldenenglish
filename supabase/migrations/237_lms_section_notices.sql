CREATE TABLE IF NOT EXISTS public.section_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  body_text TEXT NOT NULL CHECK (char_length(btrim(body_text)) BETWEEN 1 AND 500),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS section_notices_active_idx
  ON public.section_notices (section_id, published_at DESC)
  WHERE archived_at IS NULL;

ALTER TABLE public.section_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_notices_select ON public.section_notices;
CREATE POLICY section_notices_select ON public.section_notices
  FOR SELECT TO authenticated
  USING (
    archived_at IS NULL
    AND (
      public.learning_task_staff_can_manage_section(auth.uid(), section_id)
      OR EXISTS (
        SELECT 1 FROM public.section_enrollments e
        WHERE e.section_id = section_notices.section_id
          AND e.status = 'active'
          AND (
            e.student_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.tutor_student_rel ts
              WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS section_notices_insert ON public.section_notices;
CREATE POLICY section_notices_insert ON public.section_notices
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.learning_task_staff_can_manage_section(auth.uid(), section_id)
  );

DROP POLICY IF EXISTS section_notices_update ON public.section_notices;
CREATE POLICY section_notices_update ON public.section_notices
  FOR UPDATE TO authenticated
  USING (public.learning_task_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.learning_task_staff_can_manage_section(auth.uid(), section_id));

GRANT SELECT, INSERT, UPDATE ON public.section_notices TO authenticated;
