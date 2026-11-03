CREATE TABLE IF NOT EXISTS public.student_course_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ NULL,
  CONSTRAINT student_course_completions_unique UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS student_course_completions_student_idx
  ON public.student_course_completions (student_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.student_course_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_course_completions_select ON public.student_course_completions;
CREATE POLICY student_course_completions_select ON public.student_course_completions
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_course_completions.student_id
    )
    OR public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'teacher')
    OR public.user_has_role(auth.uid(), 'assistant')
  );

GRANT SELECT ON public.student_course_completions TO authenticated;

INSERT INTO public.badge_catalog (code, category, criteria_type, criteria_threshold, sort_order)
SELECT 'course_completed_1', 'learning', 'course_completed', 1, 80
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_catalog WHERE code = 'course_completed_1'
);

INSERT INTO public.badge_translations (badge_id, locale, title, description)
SELECT c.id, v.locale, v.title, v.description
FROM public.badge_catalog c
JOIN (
  VALUES
    ('en', 'Course complete', 'Finish every lesson in a course.'),
    ('es', 'Curso completo', 'Termina todas las clases de un curso.')
) AS v(locale, title, description) ON true
WHERE c.code = 'course_completed_1'
  AND NOT EXISTS (
    SELECT 1 FROM public.badge_translations t
    WHERE t.badge_id = c.id AND t.locale = v.locale
  );
