-- Courses: packaged modules and lessons. A route is an ordered list of courses.
-- Existing route steps are copied into one course each. Step rows stay.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
    CREATE TYPE public.course_status AS ENUM ('draft', 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_progress_mode') THEN
    CREATE TYPE public.course_progress_mode AS ENUM ('open', 'sequential');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_course_grant_source') THEN
    CREATE TYPE public.student_course_grant_source AS ENUM ('admin', 'purchase');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_order_status') THEN
    CREATE TYPE public.course_order_status AS ENUM ('pending', 'paid', 'failed', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  slug TEXT NULL,
  status public.course_status NOT NULL DEFAULT 'draft',
  progress_mode public.course_progress_mode NOT NULL DEFAULT 'open',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  listed_in_shop BOOLEAN NOT NULL DEFAULT false,
  cover_path TEXT NULL,
  migrated_from_step_id UUID NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT courses_slug_unique UNIQUE (slug),
  CONSTRAINT courses_migrated_step_unique UNIQUE (migrated_from_step_id),
  CONSTRAINT courses_shop_listing_shape CHECK (
    (NOT listed_in_shop)
    OR (status = 'published' AND slug IS NOT NULL AND char_length(slug) BETWEEN 1 AND 120)
  )
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules (id) ON DELETE CASCADE,
  content_template_id UUID NOT NULL REFERENCES public.content_templates (id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_route_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_route_id UUID NOT NULL REFERENCES public.learning_routes (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_route_courses_unique UNIQUE (learning_route_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.section_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_course_assignments_unique UNIQUE (section_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.student_course_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE CASCADE,
  source public.student_course_grant_source NOT NULL,
  created_by UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_course_grants_unique UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.course_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons (id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_lesson_progress_unique UNIQUE (student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.course_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.learning_courses (id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  status public.course_order_status NOT NULL DEFAULT 'pending',
  pay_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_orders_pay_token_unique UNIQUE (pay_token)
);

CREATE INDEX IF NOT EXISTS courses_status_updated_idx
  ON public.learning_courses (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS courses_listed_idx
  ON public.learning_courses (listed_in_shop, status)
  WHERE listed_in_shop = true;
CREATE INDEX IF NOT EXISTS course_modules_course_order_idx
  ON public.course_modules (course_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS course_lessons_module_order_idx
  ON public.course_lessons (module_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS learning_route_courses_route_order_idx
  ON public.learning_route_courses (learning_route_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS section_course_assignments_section_idx
  ON public.section_course_assignments (section_id, course_id);
CREATE INDEX IF NOT EXISTS student_course_grants_student_idx
  ON public.student_course_grants (student_id, course_id);
CREATE INDEX IF NOT EXISTS course_lesson_progress_student_idx
  ON public.course_lesson_progress (student_id, lesson_id);

DROP TRIGGER IF EXISTS courses_set_updated_at ON public.learning_courses;
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON public.learning_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS course_modules_set_updated_at ON public.course_modules;
CREATE TRIGGER course_modules_set_updated_at BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS course_orders_set_updated_at ON public.course_orders;
CREATE TRIGGER course_orders_set_updated_at BEFORE UPDATE ON public.course_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Copy each route step into a published open course. Safe to re-run.
INSERT INTO public.learning_courses (
  title, status, progress_mode, price, listed_in_shop, migrated_from_step_id, created_by, updated_by
)
SELECT
  left(ct.title, 180),
  'published'::public.course_status,
  'open'::public.course_progress_mode,
  0,
  false,
  s.id,
  s.created_by,
  s.updated_by
FROM public.learning_route_steps s
JOIN public.content_templates ct ON ct.id = s.content_template_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.learning_courses c WHERE c.migrated_from_step_id = s.id
);

INSERT INTO public.course_modules (course_id, title, sort_order)
SELECT c.id, left(c.title, 180), 0
FROM public.learning_courses c
WHERE c.migrated_from_step_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.course_modules m WHERE m.course_id = c.id
  );

INSERT INTO public.course_lessons (module_id, content_template_id, title, sort_order)
SELECT m.id, s.content_template_id, left(ct.title, 180), 0
FROM public.learning_courses c
JOIN public.course_modules m ON m.course_id = c.id
JOIN public.learning_route_steps s ON s.id = c.migrated_from_step_id
JOIN public.content_templates ct ON ct.id = s.content_template_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_lessons l WHERE l.module_id = m.id
);

INSERT INTO public.learning_route_courses (learning_route_id, course_id, sort_order)
SELECT s.learning_route_id, c.id, s.sort_order
FROM public.learning_courses c
JOIN public.learning_route_steps s ON s.id = c.migrated_from_step_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.learning_route_courses rc
  WHERE rc.learning_route_id = s.learning_route_id AND rc.course_id = c.id
);

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
                    )
                )
              )
          )
        )
    );
$$;

ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_route_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_course_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS courses_select_visible ON public.learning_courses;
CREATE POLICY courses_select_visible ON public.learning_courses
  FOR SELECT TO authenticated
  USING (public.course_visible_to_user(auth.uid(), id));

DROP POLICY IF EXISTS courses_select_shop ON public.learning_courses;
CREATE POLICY courses_select_shop ON public.learning_courses
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND listed_in_shop = true);

DROP POLICY IF EXISTS courses_write_admin ON public.learning_courses;
CREATE POLICY courses_write_admin ON public.learning_courses
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) AND updated_by = auth.uid());

DROP POLICY IF EXISTS course_modules_select ON public.course_modules;
CREATE POLICY course_modules_select ON public.course_modules
  FOR SELECT TO authenticated
  USING (public.course_visible_to_user(auth.uid(), course_id));

DROP POLICY IF EXISTS course_modules_select_shop ON public.course_modules;
CREATE POLICY course_modules_select_shop ON public.course_modules
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_courses c
      WHERE c.id = course_id AND c.status = 'published' AND c.listed_in_shop = true
    )
  );

DROP POLICY IF EXISTS course_modules_write_admin ON public.course_modules;
CREATE POLICY course_modules_write_admin ON public.course_modules
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS course_lessons_select ON public.course_lessons;
CREATE POLICY course_lessons_select ON public.course_lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules m
      WHERE m.id = module_id AND public.course_visible_to_user(auth.uid(), m.course_id)
    )
  );

DROP POLICY IF EXISTS course_lessons_select_shop ON public.course_lessons;
CREATE POLICY course_lessons_select_shop ON public.course_lessons
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.course_modules m
      JOIN public.learning_courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.status = 'published' AND c.listed_in_shop = true
    )
  );

DROP POLICY IF EXISTS course_lessons_write_admin ON public.course_lessons;
CREATE POLICY course_lessons_write_admin ON public.course_lessons
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS learning_route_courses_select ON public.learning_route_courses;
CREATE POLICY learning_route_courses_select ON public.learning_route_courses
  FOR SELECT TO authenticated
  USING (public.course_visible_to_user(auth.uid(), course_id));

DROP POLICY IF EXISTS learning_route_courses_write_admin ON public.learning_route_courses;
CREATE POLICY learning_route_courses_write_admin ON public.learning_route_courses
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_course_assignments_select ON public.section_course_assignments;
CREATE POLICY section_course_assignments_select ON public.section_course_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.learning_route_staff_can_manage_section(auth.uid(), section_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = section_course_assignments.section_id
        AND e.status = 'active'
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS section_course_assignments_write_admin ON public.section_course_assignments;
CREATE POLICY section_course_assignments_write_admin ON public.section_course_assignments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS student_course_grants_select ON public.student_course_grants;
CREATE POLICY student_course_grants_select ON public.student_course_grants
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_course_grants.student_id
    )
  );

DROP POLICY IF EXISTS student_course_grants_write_admin ON public.student_course_grants;
CREATE POLICY student_course_grants_write_admin ON public.student_course_grants
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS course_lesson_progress_select ON public.course_lesson_progress;
CREATE POLICY course_lesson_progress_select ON public.course_lesson_progress
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = course_lesson_progress.student_id
    )
  );

DROP POLICY IF EXISTS course_lesson_progress_write_own ON public.course_lesson_progress;
CREATE POLICY course_lesson_progress_write_own ON public.course_lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS course_orders_select_own ON public.course_orders;
CREATE POLICY course_orders_select_own ON public.course_orders
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR student_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

GRANT SELECT ON public.learning_courses TO anon, authenticated;
GRANT SELECT ON public.course_modules TO anon, authenticated;
GRANT SELECT ON public.course_lessons TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_route_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_course_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_course_grants TO authenticated;
GRANT SELECT, INSERT ON public.course_lesson_progress TO authenticated;
GRANT SELECT ON public.course_orders TO authenticated;
