-- Rename section content planning into global Learning Routes with optional section assignment.

DO $$
BEGIN
  IF to_regclass('public.section_content_plans') IS NOT NULL
     AND to_regclass('public.learning_routes') IS NULL THEN
    ALTER TABLE public.section_content_plans RENAME TO learning_routes;
  END IF;
  IF to_regclass('public.planned_lessons') IS NOT NULL
     AND to_regclass('public.learning_route_steps') IS NULL THEN
    ALTER TABLE public.planned_lessons RENAME TO learning_route_steps;
  END IF;
  IF to_regclass('public.live_lesson_planned_lesson_links') IS NOT NULL
     AND to_regclass('public.live_lesson_route_step_links') IS NULL THEN
    ALTER TABLE public.live_lesson_planned_lesson_links RENAME TO live_lesson_route_step_links;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_learning_route_mode') THEN
    CREATE TYPE public.section_learning_route_mode AS ENUM ('route', 'free_flow');
  END IF;
END $$;

ALTER TABLE public.learning_routes
  DROP CONSTRAINT IF EXISTS section_content_plans_section_uidx,
  DROP CONSTRAINT IF EXISTS learning_routes_visibility_section_shape,
  ALTER COLUMN section_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.section_learning_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  learning_route_id UUID NULL REFERENCES public.learning_routes (id) ON DELETE CASCADE,
  mode public.section_learning_route_mode NOT NULL DEFAULT 'free_flow',
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_learning_routes_section_uidx UNIQUE (section_id),
  CONSTRAINT section_learning_routes_mode_shape CHECK (
    (mode = 'free_flow' AND learning_route_id IS NULL)
    OR (mode = 'route' AND learning_route_id IS NOT NULL)
  )
);

INSERT INTO public.section_learning_routes (section_id, learning_route_id, mode, created_by, updated_by)
SELECT section_id, id, 'route'::public.section_learning_route_mode, created_by, updated_by
FROM public.learning_routes
WHERE section_id IS NOT NULL
ON CONFLICT (section_id) DO NOTHING;

ALTER TABLE public.learning_routes
  DROP COLUMN IF EXISTS section_id,
  DROP COLUMN IF EXISTS visibility;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'learning_route_steps' AND column_name = 'section_content_plan_id'
  ) THEN
    ALTER TABLE public.learning_route_steps RENAME COLUMN section_content_plan_id TO learning_route_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'learning_route_steps' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.learning_route_steps RENAME COLUMN template_id TO content_template_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_lesson_route_step_links' AND column_name = 'planned_lesson_id'
  ) THEN
    ALTER TABLE public.live_lesson_route_step_links RENAME COLUMN planned_lesson_id TO learning_route_step_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'learning_assessments' AND column_name = 'planned_lesson_id'
  ) THEN
    ALTER TABLE public.learning_assessments RENAME COLUMN planned_lesson_id TO learning_route_step_id;
  END IF;
END $$;

INSERT INTO public.content_templates (id, title, description, body_html, created_by, updated_by)
SELECT
  gen_random_uuid(),
  s.title,
  'Migrated from legacy learning route step ' || s.id::text,
  COALESCE(NULLIF(s.body_html, ''), '<p></p>'),
  s.created_by,
  s.updated_by
FROM public.learning_route_steps s
WHERE s.content_template_id IS NULL;

WITH migrated AS (
  SELECT
    s.id AS step_id,
    t.id AS template_id,
    row_number() OVER (PARTITION BY s.id ORDER BY t.created_at DESC) AS rn
  FROM public.learning_route_steps s
  JOIN public.content_templates t
    ON t.title = s.title
   AND t.created_by = s.created_by
   AND t.updated_by = s.updated_by
   AND t.description = 'Migrated from legacy learning route step ' || s.id::text
  WHERE s.content_template_id IS NULL
)
UPDATE public.learning_route_steps s
SET content_template_id = migrated.template_id
FROM migrated
WHERE migrated.step_id = s.id
  AND migrated.rn = 1;

ALTER TABLE public.learning_route_steps
  ALTER COLUMN content_template_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS learning_route_steps_content_template_fk,
  ADD CONSTRAINT learning_route_steps_content_template_fk
    FOREIGN KEY (content_template_id) REFERENCES public.content_templates (id) ON DELETE CASCADE;

ALTER TABLE public.learning_assessments
  DROP CONSTRAINT IF EXISTS learning_assessments_scope_present,
  ADD CONSTRAINT learning_assessments_scope_present CHECK (
    section_id IS NOT NULL OR learning_route_step_id IS NOT NULL OR template_id IS NOT NULL
  );

DROP INDEX IF EXISTS planned_lessons_plan_order_idx;
CREATE INDEX IF NOT EXISTS learning_route_steps_route_order_idx
  ON public.learning_route_steps (learning_route_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS section_learning_routes_route_idx
  ON public.section_learning_routes (learning_route_id, section_id);

DROP TRIGGER IF EXISTS section_content_plans_set_updated_at ON public.learning_routes;
DROP TRIGGER IF EXISTS planned_lessons_set_updated_at ON public.learning_route_steps;
DROP TRIGGER IF EXISTS learning_routes_set_updated_at ON public.learning_routes;
CREATE TRIGGER learning_routes_set_updated_at BEFORE UPDATE ON public.learning_routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS learning_route_steps_set_updated_at ON public.learning_route_steps;
CREATE TRIGGER learning_route_steps_set_updated_at BEFORE UPDATE ON public.learning_route_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS section_learning_routes_set_updated_at ON public.section_learning_routes;
CREATE TRIGGER section_learning_routes_set_updated_at BEFORE UPDATE ON public.section_learning_routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.learning_route_staff_can_manage_section(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid) OR public.user_leads_or_assists_section(p_uid, p_section_id);
$$;

CREATE OR REPLACE FUNCTION public.learning_route_staff_can_manage_global(p_uid uuid)
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

CREATE OR REPLACE FUNCTION public.learning_route_staff_can_manage_route(p_uid uuid, p_route_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.learning_route_staff_can_manage_global(p_uid)
    AND EXISTS (SELECT 1 FROM public.learning_routes r WHERE r.id = p_route_id);
$$;

CREATE OR REPLACE FUNCTION public.learning_route_visible_to_current_user(p_route_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.learning_route_staff_can_manage_global(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.section_learning_routes sr
      WHERE sr.learning_route_id = p_route_id
        AND sr.mode = 'route'
        AND (
          public.learning_route_staff_can_manage_section(auth.uid(), sr.section_id)
          OR EXISTS (
            SELECT 1
            FROM public.section_enrollments e
            WHERE e.section_id = sr.section_id
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
$$;

ALTER TABLE public.learning_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_route_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_learning_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_lesson_route_step_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_content_plans_select_scope ON public.learning_routes;
DROP POLICY IF EXISTS section_content_plans_write_staff ON public.learning_routes;
DROP POLICY IF EXISTS learning_routes_select_scope ON public.learning_routes;
DROP POLICY IF EXISTS learning_routes_write_staff ON public.learning_routes;
CREATE POLICY learning_routes_select_scope ON public.learning_routes FOR SELECT TO authenticated
  USING (public.learning_route_visible_to_current_user(id));
CREATE POLICY learning_routes_write_staff ON public.learning_routes FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_global(auth.uid()))
  WITH CHECK (updated_by = auth.uid() AND public.learning_route_staff_can_manage_global(auth.uid()));

DROP POLICY IF EXISTS planned_lessons_select_scope ON public.learning_route_steps;
DROP POLICY IF EXISTS planned_lessons_write_staff ON public.learning_route_steps;
DROP POLICY IF EXISTS learning_route_steps_select_scope ON public.learning_route_steps;
DROP POLICY IF EXISTS learning_route_steps_write_staff ON public.learning_route_steps;
CREATE POLICY learning_route_steps_select_scope ON public.learning_route_steps FOR SELECT TO authenticated
  USING (public.learning_route_visible_to_current_user(learning_route_id));
CREATE POLICY learning_route_steps_write_staff ON public.learning_route_steps FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_route(auth.uid(), learning_route_id))
  WITH CHECK (updated_by = auth.uid() AND public.learning_route_staff_can_manage_route(auth.uid(), learning_route_id));

DROP POLICY IF EXISTS section_learning_routes_select_scope ON public.section_learning_routes;
DROP POLICY IF EXISTS section_learning_routes_write_staff ON public.section_learning_routes;
CREATE POLICY section_learning_routes_select_scope ON public.section_learning_routes FOR SELECT TO authenticated
  USING (
    public.learning_route_staff_can_manage_section(auth.uid(), section_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = section_learning_routes.section_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id)
        )
    )
  );
CREATE POLICY section_learning_routes_write_staff ON public.section_learning_routes FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (
    updated_by = auth.uid()
    AND public.learning_route_staff_can_manage_section(auth.uid(), section_id)
  );

DROP POLICY IF EXISTS live_lesson_links_select_scope ON public.live_lesson_route_step_links;
DROP POLICY IF EXISTS live_lesson_links_write_staff ON public.live_lesson_route_step_links;
DROP POLICY IF EXISTS live_lesson_route_step_links_select_scope ON public.live_lesson_route_step_links;
DROP POLICY IF EXISTS live_lesson_route_step_links_write_staff ON public.live_lesson_route_step_links;
CREATE POLICY live_lesson_route_step_links_select_scope ON public.live_lesson_route_step_links FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.live_lessons l
    WHERE l.id = live_lesson_id
      AND (
        public.learning_route_staff_can_manage_section(auth.uid(), l.section_id)
        OR EXISTS (
          SELECT 1 FROM public.section_enrollments e
          WHERE e.section_id = l.section_id
            AND (
              e.student_id = auth.uid()
              OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id)
            )
        )
      )
  ));
CREATE POLICY live_lesson_route_step_links_write_staff ON public.live_lesson_route_step_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.live_lessons l WHERE l.id = live_lesson_id AND public.learning_route_staff_can_manage_section(auth.uid(), l.section_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.live_lessons l WHERE l.id = live_lesson_id AND public.learning_route_staff_can_manage_section(auth.uid(), l.section_id)));

DROP POLICY IF EXISTS live_lessons_select_scope ON public.live_lessons;
DROP POLICY IF EXISTS live_lessons_write_staff ON public.live_lessons;
CREATE POLICY live_lessons_select_scope ON public.live_lessons FOR SELECT TO authenticated
  USING (public.learning_route_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = live_lessons.section_id AND (e.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id))));
CREATE POLICY live_lessons_write_staff ON public.live_lessons FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.learning_route_staff_can_manage_section(auth.uid(), section_id) AND updated_by = auth.uid());

DROP POLICY IF EXISTS question_bank_items_select_scope ON public.question_bank_items;
DROP POLICY IF EXISTS question_bank_items_write_staff ON public.question_bank_items;
CREATE POLICY question_bank_items_select_scope ON public.question_bank_items FOR SELECT TO authenticated
  USING (visibility = 'global' OR public.learning_route_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = question_bank_items.section_id AND e.student_id = auth.uid()));
CREATE POLICY question_bank_items_write_staff ON public.question_bank_items FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_global(auth.uid()) AND (section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), section_id)))
  WITH CHECK (updated_by = auth.uid() AND public.learning_route_staff_can_manage_global(auth.uid()) AND (section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), section_id)));

DROP POLICY IF EXISTS learning_assessments_select_scope ON public.learning_assessments;
DROP POLICY IF EXISTS learning_assessments_write_staff ON public.learning_assessments;
CREATE POLICY learning_assessments_select_scope ON public.learning_assessments FOR SELECT TO authenticated
  USING (section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.section_enrollments e WHERE e.section_id = learning_assessments.section_id AND (e.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id))));
CREATE POLICY learning_assessments_write_staff ON public.learning_assessments FOR ALL TO authenticated
  USING (section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (updated_by = auth.uid() AND (section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), section_id)));

DROP POLICY IF EXISTS learning_assessment_questions_select_scope ON public.learning_assessment_questions;
DROP POLICY IF EXISTS learning_assessment_questions_write_staff ON public.learning_assessment_questions;
CREATE POLICY learning_assessment_questions_select_scope ON public.learning_assessment_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id));
CREATE POLICY learning_assessment_questions_write_staff ON public.learning_assessment_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND (a.section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), a.section_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND (a.section_id IS NULL OR public.learning_route_staff_can_manage_section(auth.uid(), a.section_id))));

DROP POLICY IF EXISTS student_assessment_attempts_select_scope ON public.student_assessment_attempts;
DROP POLICY IF EXISTS student_assessment_attempts_write_student_or_staff ON public.student_assessment_attempts;
CREATE POLICY student_assessment_attempts_select_scope ON public.student_assessment_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND a.section_id IS NOT NULL AND public.learning_route_staff_can_manage_section(auth.uid(), a.section_id)) OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_assessment_attempts.student_id));
CREATE POLICY student_assessment_attempts_write_student_or_staff ON public.student_assessment_attempts FOR ALL TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND a.section_id IS NOT NULL AND public.learning_route_staff_can_manage_section(auth.uid(), a.section_id)))
  WITH CHECK (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.learning_assessments a WHERE a.id = assessment_id AND a.section_id IS NOT NULL AND public.learning_route_staff_can_manage_section(auth.uid(), a.section_id)));

DROP POLICY IF EXISTS student_learning_readiness_select_scope ON public.student_learning_readiness;
DROP POLICY IF EXISTS student_learning_readiness_write_staff ON public.student_learning_readiness;
CREATE POLICY student_learning_readiness_select_scope ON public.student_learning_readiness FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.learning_route_staff_can_manage_section(auth.uid(), section_id) OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_learning_readiness.student_id));
CREATE POLICY student_learning_readiness_write_staff ON public.student_learning_readiness FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.learning_route_staff_can_manage_section(auth.uid(), section_id) AND set_by = auth.uid());

DROP FUNCTION IF EXISTS public.section_content_plan_visible_to_current_user(uuid);
DROP FUNCTION IF EXISTS public.section_content_staff_can_manage_section(uuid, uuid);
DROP FUNCTION IF EXISTS public.section_content_staff_can_manage_global(uuid);
