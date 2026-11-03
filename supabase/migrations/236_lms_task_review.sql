-- Answers, teacher notes, and the RETURNED progress shape.

ALTER TABLE public.student_task_progress DROP CONSTRAINT IF EXISTS student_task_progress_completion_shape;
ALTER TABLE public.student_task_progress
  ADD CONSTRAINT student_task_progress_completion_shape CHECK (
    (status IN ('COMPLETED', 'COMPLETED_LATE') AND completed_at IS NOT NULL AND opened_at IS NOT NULL)
    OR (status = 'OPENED' AND opened_at IS NOT NULL AND completed_at IS NULL)
    OR (status = 'NOT_OPENED' AND completed_at IS NULL)
    OR (status = 'RETURNED' AND opened_at IS NOT NULL AND completed_at IS NULL)
  );

DROP POLICY IF EXISTS student_task_progress_staff_update ON public.student_task_progress;
CREATE POLICY student_task_progress_staff_update ON public.student_task_progress
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = student_task_progress.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = student_task_progress.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  );

CREATE OR REPLACE FUNCTION public.guard_student_task_progress_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.student_id AND NEW.status = 'RETURNED' AND OLD.status IS DISTINCT FROM 'RETURNED' THEN
    RAISE EXCEPTION 'student_cannot_return' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() = NEW.student_id AND OLD.status IN ('COMPLETED', 'COMPLETED_LATE') THEN
    RAISE EXCEPTION 'student_cannot_reopen' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_task_progress_guard_status ON public.student_task_progress;
CREATE TRIGGER student_task_progress_guard_status
  BEFORE UPDATE ON public.student_task_progress
  FOR EACH ROW EXECUTE FUNCTION public.guard_student_task_progress_status();

CREATE TABLE IF NOT EXISTS public.student_task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES public.student_task_progress (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  body_text TEXT NOT NULL CHECK (char_length(btrim(body_text)) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_task_submissions_progress_idx
  ON public.student_task_submissions (progress_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.student_task_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES public.student_task_progress (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  body_text TEXT NOT NULL CHECK (char_length(btrim(body_text)) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_task_reviews_progress_idx
  ON public.student_task_reviews (progress_id, created_at DESC);

ALTER TABLE public.student_task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_task_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_task_submissions_select ON public.student_task_submissions;
CREATE POLICY student_task_submissions_select ON public.student_task_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.student_task_progress p
      JOIN public.task_instances ti ON ti.id = p.task_instance_id
      WHERE p.id = progress_id
        AND (
          p.student_id = auth.uid()
          OR public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = p.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS student_task_submissions_insert ON public.student_task_submissions;
CREATE POLICY student_task_submissions_insert ON public.student_task_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.student_task_progress p
      WHERE p.id = progress_id AND p.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_task_reviews_select ON public.student_task_reviews;
CREATE POLICY student_task_reviews_select ON public.student_task_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.student_task_progress p
      JOIN public.task_instances ti ON ti.id = p.task_instance_id
      WHERE p.id = progress_id
        AND (
          p.student_id = auth.uid()
          OR public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = p.student_id
          )
        )
    )
  );

GRANT SELECT, INSERT ON public.student_task_submissions TO authenticated;
GRANT SELECT, INSERT ON public.student_task_reviews TO authenticated;

DROP POLICY IF EXISTS student_task_reviews_insert ON public.student_task_reviews;
CREATE POLICY student_task_reviews_insert ON public.student_task_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.student_task_progress p
      JOIN public.task_instances ti ON ti.id = p.task_instance_id
      WHERE p.id = progress_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  );
