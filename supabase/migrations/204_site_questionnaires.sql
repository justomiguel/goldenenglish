-- Site questionnaires: dedicated module (not events, not the academic question bank).
-- Additive only. Anon gets named SELECT/INSERT grants — never GRANT ALL.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questionnaire_status') THEN
    CREATE TYPE public.questionnaire_status AS ENUM ('draft', 'published', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questionnaire_visibility') THEN
    CREATE TYPE public.questionnaire_visibility AS ENUM ('public', 'private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questionnaire_question_type') THEN
    CREATE TYPE public.questionnaire_question_type AS ENUM (
      'text',
      'textarea',
      'email',
      'phone',
      'number',
      'date',
      'yes_no',
      'single_choice',
      'multi_choice',
      'scale'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.questionnaire_status NOT NULL DEFAULT 'draft',
  visibility public.questionnaire_visibility NOT NULL DEFAULT 'public',
  limit_one_response BOOLEAN NOT NULL DEFAULT false,
  show_on_landing BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questionnaires_slug_format CHECK (
    char_length(slug) BETWEEN 2 AND 80
    AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS questionnaires_slug_active_uidx
  ON public.questionnaires (slug)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS questionnaires_landing_idx
  ON public.questionnaires (published_at DESC)
  WHERE status = 'published' AND archived_at IS NULL AND show_on_landing = true;

DROP TRIGGER IF EXISTS questionnaires_set_updated_at ON public.questionnaires;
CREATE TRIGGER questionnaires_set_updated_at
  BEFORE UPDATE ON public.questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires (id) ON DELETE CASCADE,
  question_type public.questionnaire_question_type NOT NULL,
  prompt_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  help_text_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  options_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  required BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS questionnaire_questions_parent_position_idx
  ON public.questionnaire_questions (questionnaire_id, position, created_at);

DROP TRIGGER IF EXISTS questionnaire_questions_set_updated_at ON public.questionnaire_questions;
CREATE TRIGGER questionnaire_questions_set_updated_at
  BEFORE UPDATE ON public.questionnaire_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires (id) ON DELETE RESTRICT,
  respondent_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  respondent_email TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('es', 'en', 'pt')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS questionnaire_responses_parent_idx
  ON public.questionnaire_responses (questionnaire_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.questionnaire_responses (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions (id) ON DELETE RESTRICT,
  value_text TEXT,
  value_number DOUBLE PRECISION,
  value_options TEXT[],
  CONSTRAINT questionnaire_answers_response_question_unique UNIQUE (response_id, question_id)
);

CREATE INDEX IF NOT EXISTS questionnaire_answers_question_idx
  ON public.questionnaire_answers (question_id);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questionnaires_select_public_or_admin ON public.questionnaires;
CREATE POLICY questionnaires_select_public_or_admin ON public.questionnaires
  FOR SELECT TO anon, authenticated
  USING (
    (
      archived_at IS NULL
      AND status = 'published'
      AND (
        visibility = 'public'
        OR auth.uid() IS NOT NULL
        OR show_on_landing = true
      )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS questionnaires_modify_admin ON public.questionnaires;
CREATE POLICY questionnaires_modify_admin ON public.questionnaires
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS questionnaire_questions_select_public_or_admin ON public.questionnaire_questions;
CREATE POLICY questionnaire_questions_select_public_or_admin ON public.questionnaire_questions
  FOR SELECT TO anon, authenticated
  USING (
    (
      archived_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.questionnaires q
        WHERE q.id = questionnaire_questions.questionnaire_id
          AND q.archived_at IS NULL
          AND q.status = 'published'
          AND (q.visibility = 'public' OR auth.uid() IS NOT NULL)
      )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS questionnaire_questions_modify_admin ON public.questionnaire_questions;
CREATE POLICY questionnaire_questions_modify_admin ON public.questionnaire_questions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS questionnaire_responses_select_own_or_admin ON public.questionnaire_responses;
CREATE POLICY questionnaire_responses_select_own_or_admin ON public.questionnaire_responses
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin(auth.uid())
    OR respondent_user_id = auth.uid()
  );

DROP POLICY IF EXISTS questionnaire_responses_insert_when_open ON public.questionnaire_responses;
CREATE POLICY questionnaire_responses_insert_when_open ON public.questionnaire_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.questionnaires q
      WHERE q.id = questionnaire_responses.questionnaire_id
        AND q.archived_at IS NULL
        AND q.status = 'published'
        AND (q.visibility = 'public' OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS questionnaire_answers_select_own_or_admin ON public.questionnaire_answers;
CREATE POLICY questionnaire_answers_select_own_or_admin ON public.questionnaire_answers
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.questionnaire_responses r
      WHERE r.id = questionnaire_answers.response_id
        AND (
          public.is_admin(auth.uid())
          OR r.respondent_user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS questionnaire_answers_insert_when_open ON public.questionnaire_answers;
CREATE POLICY questionnaire_answers_insert_when_open ON public.questionnaire_answers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.questionnaire_responses r
      JOIN public.questionnaires q ON q.id = r.questionnaire_id
      WHERE r.id = questionnaire_answers.response_id
        AND q.archived_at IS NULL
        AND q.status = 'published'
        AND (q.visibility = 'public' OR auth.uid() IS NOT NULL)
    )
  );

CREATE OR REPLACE FUNCTION public.lock_questionnaire_for_submit(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM public.questionnaires WHERE id = p_id FOR UPDATE;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_questionnaire_for_submit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_questionnaire_for_submit(uuid) TO service_role;

GRANT SELECT ON public.questionnaires TO anon, authenticated;
GRANT SELECT ON public.questionnaire_questions TO anon, authenticated;
GRANT SELECT, INSERT ON public.questionnaire_responses TO anon, authenticated;
GRANT SELECT, INSERT ON public.questionnaire_answers TO anon, authenticated;

COMMENT ON TABLE public.questionnaires IS
  'Site questionnaires (settings). Public or login-only; not event forms or class assessments.';
