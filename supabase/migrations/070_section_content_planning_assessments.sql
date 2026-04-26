-- Section content planning, planned/live lessons, reusable question bank, assessments, and readiness.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_content_plan_status') THEN
    CREATE TYPE public.section_content_plan_status AS ENUM ('draft', 'active', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planned_lesson_kind') THEN
    CREATE TYPE public.planned_lesson_kind AS ENUM ('lesson', 'unit', 'review', 'exam_prep', 'remediation');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_lesson_coverage_status') THEN
    CREATE TYPE public.live_lesson_coverage_status AS ENUM ('as_planned', 'merged', 'split', 'skipped', 'remediation', 'extra');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_bank_item_type') THEN
    CREATE TYPE public.question_bank_item_type AS ENUM ('true_false', 'multiple_choice', 'short_answer', 'rubric', 'oral_check');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_bank_visibility') THEN
    CREATE TYPE public.question_bank_visibility AS ENUM ('global', 'section');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_assessment_kind') THEN
    CREATE TYPE public.learning_assessment_kind AS ENUM ('entry', 'exit', 'formative', 'mini_test', 'diagnostic');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_assessment_grading_mode') THEN
    CREATE TYPE public.learning_assessment_grading_mode AS ENUM ('numeric', 'pass_fail', 'diagnostic', 'rubric', 'manual_feedback');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_assessment_attempt_status') THEN
    CREATE TYPE public.student_assessment_attempt_status AS ENUM ('submitted', 'reviewed', 'needs_review');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_learning_readiness_status') THEN
    CREATE TYPE public.student_learning_readiness_status AS ENUM ('ready', 'needs_support', 'teacher_override');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.section_content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  teacher_objectives TEXT NOT NULL DEFAULT '',
  general_scope TEXT NOT NULL DEFAULT '',
  evaluation_criteria TEXT NOT NULL DEFAULT '',
  status public.section_content_plan_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_content_plans_section_uidx UNIQUE (section_id)
);

CREATE TABLE IF NOT EXISTS public.planned_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_content_plan_id UUID NOT NULL REFERENCES public.section_content_plans (id) ON DELETE CASCADE,
  -- Optional detached source pointer. No FK: this migration must also run on
  -- databases where the global content template library has not been created.
  template_id UUID NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  body_html TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  lesson_kind public.planned_lesson_kind NOT NULL DEFAULT 'lesson',
  estimated_sessions NUMERIC(4, 1) NULL CHECK (estimated_sessions IS NULL OR estimated_sessions > 0),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  taught_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT NOT NULL DEFAULT '',
  teacher_notes TEXT NOT NULL DEFAULT '',
  coverage_status public.live_lesson_coverage_status NOT NULL DEFAULT 'as_planned',
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_lesson_planned_lesson_links (
  live_lesson_id UUID NOT NULL REFERENCES public.live_lessons (id) ON DELETE CASCADE,
  planned_lesson_id UUID NOT NULL REFERENCES public.planned_lessons (id) ON DELETE CASCADE,
  coverage_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (live_lesson_id, planned_lesson_id)
);

CREATE TABLE IF NOT EXISTS public.question_bank_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  visibility public.question_bank_visibility NOT NULL DEFAULT 'global',
  question_type public.question_bank_item_type NOT NULL,
  prompt TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 1 AND 4000),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB NULL,
  explanation TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  cefr_level TEXT NULL,
  skill TEXT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_bank_section_visibility CHECK (
    (visibility = 'global' AND section_id IS NULL)
    OR (visibility = 'section' AND section_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.learning_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  planned_lesson_id UUID NULL REFERENCES public.planned_lessons (id) ON DELETE CASCADE,
  -- Optional detached source pointer; see planned_lessons.template_id.
  template_id UUID NULL,
  assessment_kind public.learning_assessment_kind NOT NULL,
  grading_mode public.learning_assessment_grading_mode NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  instructions TEXT NOT NULL DEFAULT '',
  passing_score NUMERIC(6, 2) NULL CHECK (passing_score IS NULL OR (passing_score >= 0 AND passing_score <= 100)),
  allow_retake BOOLEAN NOT NULL DEFAULT TRUE,
  required_for_completion BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_assessments_scope_present CHECK (
    section_id IS NOT NULL OR planned_lesson_id IS NOT NULL OR template_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.learning_assessment_questions (
  assessment_id UUID NOT NULL REFERENCES public.learning_assessments (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank_items (id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  points NUMERIC(6, 2) NULL CHECK (points IS NULL OR points >= 0),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assessment_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.student_assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.learning_assessments (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  enrollment_id UUID NULL REFERENCES public.section_enrollments (id) ON DELETE SET NULL,
  attempt_no INT NOT NULL DEFAULT 1 CHECK (attempt_no > 0),
  status public.student_assessment_attempt_status NOT NULL DEFAULT 'submitted',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  question_snapshots JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC(6, 2) NULL CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  passed BOOLEAN NULL,
  diagnostic_label TEXT NULL,
  teacher_feedback TEXT NOT NULL DEFAULT '',
  reviewed_by UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_assessment_attempts_uidx UNIQUE (assessment_id, student_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS public.student_learning_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  assessment_attempt_id UUID NULL REFERENCES public.student_assessment_attempts (id) ON DELETE SET NULL,
  readiness_status public.student_learning_readiness_status NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  set_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_learning_readiness_uidx UNIQUE (student_id, section_id)
);

CREATE INDEX IF NOT EXISTS planned_lessons_plan_order_idx ON public.planned_lessons (section_content_plan_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS live_lessons_section_taught_idx ON public.live_lessons (section_id, taught_at DESC);
CREATE INDEX IF NOT EXISTS question_bank_items_scope_idx ON public.question_bank_items (visibility, section_id, question_type);
CREATE INDEX IF NOT EXISTS learning_assessments_section_kind_idx ON public.learning_assessments (section_id, assessment_kind);
CREATE INDEX IF NOT EXISTS student_assessment_attempts_student_idx ON public.student_assessment_attempts (student_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS student_learning_readiness_section_idx ON public.student_learning_readiness (section_id, readiness_status);

DROP TRIGGER IF EXISTS section_content_plans_set_updated_at ON public.section_content_plans;
CREATE TRIGGER section_content_plans_set_updated_at BEFORE UPDATE ON public.section_content_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS planned_lessons_set_updated_at ON public.planned_lessons;
CREATE TRIGGER planned_lessons_set_updated_at BEFORE UPDATE ON public.planned_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS live_lessons_set_updated_at ON public.live_lessons;
CREATE TRIGGER live_lessons_set_updated_at BEFORE UPDATE ON public.live_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS question_bank_items_set_updated_at ON public.question_bank_items;
CREATE TRIGGER question_bank_items_set_updated_at BEFORE UPDATE ON public.question_bank_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS learning_assessments_set_updated_at ON public.learning_assessments;
CREATE TRIGGER learning_assessments_set_updated_at BEFORE UPDATE ON public.learning_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS student_assessment_attempts_set_updated_at ON public.student_assessment_attempts;
CREATE TRIGGER student_assessment_attempts_set_updated_at BEFORE UPDATE ON public.student_assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS student_learning_readiness_set_updated_at ON public.student_learning_readiness;
CREATE TRIGGER student_learning_readiness_set_updated_at BEFORE UPDATE ON public.student_learning_readiness
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.section_content_staff_can_manage_section(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid) OR public.user_leads_or_assists_section(p_uid, p_section_id);
$$;

CREATE OR REPLACE FUNCTION public.section_content_staff_can_manage_global(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid)
    OR public.user_has_role(p_uid, 'teacher')
    OR public.user_has_role(p_uid, 'assistant');
$$;

CREATE OR REPLACE FUNCTION public.section_content_plan_visible_to_current_user(p_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_content_plans p
    JOIN public.section_enrollments e ON e.section_id = p.section_id
    WHERE p.id = p_plan_id
      AND (
        public.section_content_staff_can_manage_section(auth.uid(), p.section_id)
        OR e.student_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
        )
      )
  );
$$;

ALTER TABLE public.section_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_lesson_planned_lesson_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_learning_readiness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_content_plans_select_scope ON public.section_content_plans;
DROP POLICY IF EXISTS section_content_plans_write_staff ON public.section_content_plans;
DROP POLICY IF EXISTS planned_lessons_select_scope ON public.planned_lessons;
DROP POLICY IF EXISTS planned_lessons_write_staff ON public.planned_lessons;
DROP POLICY IF EXISTS live_lessons_select_scope ON public.live_lessons;
DROP POLICY IF EXISTS live_lessons_write_staff ON public.live_lessons;
DROP POLICY IF EXISTS live_lesson_links_select_scope ON public.live_lesson_planned_lesson_links;
DROP POLICY IF EXISTS live_lesson_links_write_staff ON public.live_lesson_planned_lesson_links;
DROP POLICY IF EXISTS question_bank_items_select_scope ON public.question_bank_items;
DROP POLICY IF EXISTS question_bank_items_write_staff ON public.question_bank_items;
DROP POLICY IF EXISTS learning_assessments_select_scope ON public.learning_assessments;
DROP POLICY IF EXISTS learning_assessments_write_staff ON public.learning_assessments;
DROP POLICY IF EXISTS learning_assessment_questions_select_scope ON public.learning_assessment_questions;
DROP POLICY IF EXISTS learning_assessment_questions_write_staff ON public.learning_assessment_questions;
DROP POLICY IF EXISTS student_assessment_attempts_select_scope ON public.student_assessment_attempts;
DROP POLICY IF EXISTS student_assessment_attempts_write_student_or_staff ON public.student_assessment_attempts;
DROP POLICY IF EXISTS student_learning_readiness_select_scope ON public.student_learning_readiness;
DROP POLICY IF EXISTS student_learning_readiness_write_staff ON public.student_learning_readiness;

CREATE POLICY section_content_plans_select_scope ON public.section_content_plans FOR SELECT TO authenticated
  USING (public.section_content_plan_visible_to_current_user(id));
CREATE POLICY section_content_plans_write_staff ON public.section_content_plans FOR ALL TO authenticated
  USING (public.section_content_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.section_content_staff_can_manage_section(auth.uid(), section_id) AND updated_by = auth.uid());

CREATE POLICY planned_lessons_select_scope ON public.planned_lessons FOR SELECT TO authenticated
  USING (public.section_content_plan_visible_to_current_user(section_content_plan_id));
CREATE POLICY planned_lessons_write_staff ON public.planned_lessons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.section_content_plans p WHERE p.id = section_content_plan_id AND public.section_content_staff_can_manage_section(auth.uid(), p.section_id)))
  WITH CHECK (updated_by = auth.uid() AND EXISTS (SELECT 1 FROM public.section_content_plans p WHERE p.id = section_content_plan_id AND public.section_content_staff_can_manage_section(auth.uid(), p.section_id)));

CREATE POLICY live_lessons_select_scope ON public.live_lessons FOR SELECT TO authenticated
  USING (public.section_content_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = live_lessons.section_id AND (e.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id))));
CREATE POLICY live_lessons_write_staff ON public.live_lessons FOR ALL TO authenticated
  USING (public.section_content_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.section_content_staff_can_manage_section(auth.uid(), section_id) AND updated_by = auth.uid());

CREATE POLICY live_lesson_links_select_scope ON public.live_lesson_planned_lesson_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.live_lessons l WHERE l.id = live_lesson_id AND (public.section_content_staff_can_manage_section(auth.uid(), l.section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = l.section_id AND (e.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id))))));
CREATE POLICY live_lesson_links_write_staff ON public.live_lesson_planned_lesson_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.live_lessons l WHERE l.id = live_lesson_id AND public.section_content_staff_can_manage_section(auth.uid(), l.section_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.live_lessons l WHERE l.id = live_lesson_id AND public.section_content_staff_can_manage_section(auth.uid(), l.section_id)));

CREATE POLICY question_bank_items_select_scope ON public.question_bank_items FOR SELECT TO authenticated
  USING (visibility = 'global' OR public.section_content_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = question_bank_items.section_id AND e.student_id = auth.uid()));
CREATE POLICY question_bank_items_write_staff ON public.question_bank_items FOR ALL TO authenticated
  USING (public.section_content_staff_can_manage_global(auth.uid()) AND (section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), section_id)))
  WITH CHECK (updated_by = auth.uid() AND public.section_content_staff_can_manage_global(auth.uid()) AND (section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), section_id)));

CREATE POLICY learning_assessments_select_scope ON public.learning_assessments FOR SELECT TO authenticated
  USING (section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = learning_assessments.section_id AND (e.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id))));
CREATE POLICY learning_assessments_write_staff ON public.learning_assessments FOR ALL TO authenticated
  USING (section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (updated_by = auth.uid() AND (section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), section_id)));

CREATE POLICY learning_assessment_questions_select_scope ON public.learning_assessment_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id));
CREATE POLICY learning_assessment_questions_write_staff ON public.learning_assessment_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND (a.section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), a.section_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND (a.section_id IS NULL OR public.section_content_staff_can_manage_section(auth.uid(), a.section_id))));

CREATE POLICY student_assessment_attempts_select_scope ON public.student_assessment_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND a.section_id IS NOT NULL AND public.section_content_staff_can_manage_section(auth.uid(), a.section_id)) OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_assessment_attempts.student_id));
CREATE POLICY student_assessment_attempts_write_student_or_staff ON public.student_assessment_attempts FOR ALL TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND a.section_id IS NOT NULL AND public.section_content_staff_can_manage_section(auth.uid(), a.section_id)))
  WITH CHECK (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND a.section_id IS NOT NULL AND public.section_content_staff_can_manage_section(auth.uid(), a.section_id)));

CREATE POLICY student_learning_readiness_select_scope ON public.student_learning_readiness FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.section_content_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_learning_readiness.student_id));
CREATE POLICY student_learning_readiness_write_staff ON public.student_learning_readiness FOR ALL TO authenticated
  USING (public.section_content_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.section_content_staff_can_manage_section(auth.uid(), section_id) AND set_by = auth.uid());
