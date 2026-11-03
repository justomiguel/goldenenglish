-- LMS catalog: category tree, hashtags, course fields, and program sets.
-- Existing learning_routes stay.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_field_kind') THEN
    CREATE TYPE public.course_field_kind AS ENUM ('text', 'dropdown', 'checkbox', 'date');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_set_completion') THEN
    CREATE TYPE public.program_set_completion AS ENUM ('all_in_order', 'all_any_order', 'at_least');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NULL REFERENCES public.course_categories (id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_categories_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id)
);

ALTER TABLE public.learning_courses
  ADD COLUMN IF NOT EXISTS category_id UUID NULL REFERENCES public.course_categories (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.catalog_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL CHECK (label ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalog_hashtags_label_unique UNIQUE (label)
);

CREATE TABLE IF NOT EXISTS public.course_hashtags (
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.catalog_hashtags (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS public.content_template_hashtags (
  template_id UUID NOT NULL REFERENCES public.content_templates (id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.catalog_hashtags (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (template_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS public.course_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  kind public.course_field_kind NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.course_field_definitions (id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.course_field_values (
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.course_field_definitions (id) ON DELETE CASCADE,
  value_text TEXT NULL CHECK (value_text IS NULL OR char_length(value_text) <= 500),
  option_id UUID NULL REFERENCES public.course_field_options (id) ON DELETE RESTRICT,
  value_bool BOOLEAN NULL,
  value_date DATE NULL,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, field_id)
);

CREATE TABLE IF NOT EXISTS public.learning_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_program_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.learning_programs (id) ON DELETE CASCADE,
  parent_set_id UUID NULL REFERENCES public.learning_program_sets (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  completion public.program_set_completion NOT NULL,
  at_least_count INT NULL CHECK (at_least_count IS NULL OR at_least_count >= 1),
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT learning_program_sets_parent_not_self CHECK (parent_set_id IS NULL OR parent_set_id <> id),
  CONSTRAINT learning_program_sets_at_least_shape CHECK (
    (completion = 'at_least' AND at_least_count IS NOT NULL)
    OR (completion <> 'at_least' AND at_least_count IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.learning_program_set_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.learning_program_sets (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT learning_program_set_courses_unique UNIQUE (set_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.section_program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.learning_programs (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_program_assignments_unique UNIQUE (section_id, program_id)
);

CREATE INDEX IF NOT EXISTS course_categories_parent_idx ON public.course_categories (parent_id, sort_order, name);
CREATE INDEX IF NOT EXISTS learning_courses_category_idx ON public.learning_courses (category_id);
CREATE INDEX IF NOT EXISTS course_hashtags_hashtag_idx ON public.course_hashtags (hashtag_id);
CREATE INDEX IF NOT EXISTS content_template_hashtags_hashtag_idx ON public.content_template_hashtags (hashtag_id);
CREATE INDEX IF NOT EXISTS course_field_options_field_idx ON public.course_field_options (field_id, sort_order);
CREATE INDEX IF NOT EXISTS learning_program_sets_program_idx ON public.learning_program_sets (program_id, sort_order);
CREATE INDEX IF NOT EXISTS learning_program_set_courses_course_idx ON public.learning_program_set_courses (course_id);
CREATE INDEX IF NOT EXISTS section_program_assignments_section_idx ON public.section_program_assignments (section_id, program_id);

DROP TRIGGER IF EXISTS course_categories_set_updated_at ON public.course_categories;
CREATE TRIGGER course_categories_set_updated_at BEFORE UPDATE ON public.course_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS course_field_definitions_set_updated_at ON public.course_field_definitions;
CREATE TRIGGER course_field_definitions_set_updated_at BEFORE UPDATE ON public.course_field_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS learning_programs_set_updated_at ON public.learning_programs;
CREATE TRIGGER learning_programs_set_updated_at BEFORE UPDATE ON public.learning_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.course_visible_to_user(p_uid uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid)
    OR public.user_has_role(p_uid, 'teacher')
    OR public.user_has_role(p_uid, 'assistant')
    OR EXISTS (
      SELECT 1
      FROM public.learning_courses c
      WHERE c.id = p_course_id
        AND c.status = 'published'
        AND (
          EXISTS (
            SELECT 1 FROM public.student_course_grants g
            WHERE g.course_id = c.id AND g.student_id = p_uid
          )
          OR EXISTS (
            SELECT 1
            FROM public.section_enrollments e
            WHERE e.student_id = p_uid
              AND e.status = 'active'
              AND (
                EXISTS (
                  SELECT 1 FROM public.section_course_assignments a
                  WHERE a.section_id = e.section_id AND a.course_id = c.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM public.section_learning_routes sr
                  JOIN public.learning_route_courses rc ON rc.learning_route_id = sr.learning_route_id
                  WHERE sr.section_id = e.section_id
                    AND sr.mode = 'route'
                    AND rc.course_id = c.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM public.section_program_assignments spa
                  JOIN public.learning_program_sets s ON s.program_id = spa.program_id
                  JOIN public.learning_program_set_courses sc ON sc.set_id = s.id
                  WHERE spa.section_id = e.section_id
                    AND sc.course_id = c.id
                )
              )
          )
          OR EXISTS (
            SELECT 1
            FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = p_uid
              AND (
                EXISTS (
                  SELECT 1 FROM public.student_course_grants g
                  WHERE g.student_id = ts.student_id AND g.course_id = p_course_id
                )
                OR EXISTS (
                  SELECT 1
                  FROM public.section_enrollments e
                  WHERE e.student_id = ts.student_id
                    AND e.status = 'active'
                    AND (
                      EXISTS (
                        SELECT 1 FROM public.section_course_assignments a
                        WHERE a.section_id = e.section_id AND a.course_id = p_course_id
                      )
                      OR EXISTS (
                        SELECT 1
                        FROM public.section_learning_routes sr
                        JOIN public.learning_route_courses rc ON rc.learning_route_id = sr.learning_route_id
                        WHERE sr.section_id = e.section_id
                          AND sr.mode = 'route'
                          AND rc.course_id = p_course_id
                      )
                      OR EXISTS (
                        SELECT 1
                        FROM public.section_program_assignments spa
                        JOIN public.learning_program_sets s ON s.program_id = spa.program_id
                        JOIN public.learning_program_set_courses sc ON sc.set_id = s.id
                        WHERE spa.section_id = e.section_id
                          AND sc.course_id = p_course_id
                      )
                    )
                )
              )
          )
        )
    );
$$;

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_template_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_program_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_program_set_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_program_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_categories_select ON public.course_categories;
CREATE POLICY course_categories_select ON public.course_categories
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS course_categories_write_admin ON public.course_categories;
CREATE POLICY course_categories_write_admin ON public.course_categories
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS catalog_hashtags_select ON public.catalog_hashtags;
CREATE POLICY catalog_hashtags_select ON public.catalog_hashtags
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS catalog_hashtags_write_admin ON public.catalog_hashtags;
CREATE POLICY catalog_hashtags_write_admin ON public.catalog_hashtags
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS course_hashtags_select ON public.course_hashtags;
CREATE POLICY course_hashtags_select ON public.course_hashtags
  FOR SELECT TO authenticated
  USING (public.course_visible_to_user(auth.uid(), course_id));
DROP POLICY IF EXISTS course_hashtags_write_admin ON public.course_hashtags;
CREATE POLICY course_hashtags_write_admin ON public.course_hashtags
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS content_template_hashtags_select ON public.content_template_hashtags;
CREATE POLICY content_template_hashtags_select ON public.content_template_hashtags
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS content_template_hashtags_write_admin ON public.content_template_hashtags;
CREATE POLICY content_template_hashtags_write_admin ON public.content_template_hashtags
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS course_field_definitions_select ON public.course_field_definitions;
CREATE POLICY course_field_definitions_select ON public.course_field_definitions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS course_field_definitions_write_admin ON public.course_field_definitions;
CREATE POLICY course_field_definitions_write_admin ON public.course_field_definitions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS course_field_options_select ON public.course_field_options;
CREATE POLICY course_field_options_select ON public.course_field_options
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS course_field_options_write_admin ON public.course_field_options;
CREATE POLICY course_field_options_write_admin ON public.course_field_options
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS course_field_values_select ON public.course_field_values;
CREATE POLICY course_field_values_select ON public.course_field_values
  FOR SELECT TO authenticated
  USING (public.course_visible_to_user(auth.uid(), course_id));
DROP POLICY IF EXISTS course_field_values_write_admin ON public.course_field_values;
CREATE POLICY course_field_values_write_admin ON public.course_field_values
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS learning_programs_select ON public.learning_programs;
CREATE POLICY learning_programs_select ON public.learning_programs
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'teacher')
    OR public.user_has_role(auth.uid(), 'assistant')
  );
DROP POLICY IF EXISTS learning_programs_write_admin ON public.learning_programs;
CREATE POLICY learning_programs_write_admin ON public.learning_programs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS learning_program_sets_select ON public.learning_program_sets;
CREATE POLICY learning_program_sets_select ON public.learning_program_sets
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'teacher')
    OR public.user_has_role(auth.uid(), 'assistant')
  );
DROP POLICY IF EXISTS learning_program_sets_write_admin ON public.learning_program_sets;
CREATE POLICY learning_program_sets_write_admin ON public.learning_program_sets
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS learning_program_set_courses_select ON public.learning_program_set_courses;
CREATE POLICY learning_program_set_courses_select ON public.learning_program_set_courses
  FOR SELECT TO authenticated
  USING (public.course_visible_to_user(auth.uid(), course_id));
DROP POLICY IF EXISTS learning_program_set_courses_write_admin ON public.learning_program_set_courses;
CREATE POLICY learning_program_set_courses_write_admin ON public.learning_program_set_courses
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_program_assignments_select ON public.section_program_assignments;
CREATE POLICY section_program_assignments_select ON public.section_program_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'teacher')
    OR public.user_has_role(auth.uid(), 'assistant')
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = section_program_assignments.section_id
        AND e.student_id = auth.uid()
        AND e.status = 'active'
    )
  );
DROP POLICY IF EXISTS section_program_assignments_write_admin ON public.section_program_assignments;
CREATE POLICY section_program_assignments_write_admin ON public.section_program_assignments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_hashtags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_hashtags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_template_hashtags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_field_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_field_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_field_values TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_program_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_program_set_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_program_assignments TO authenticated;
