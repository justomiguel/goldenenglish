-- Admin-managed catalog for student badges.
-- Tables: badge_catalog (1 row per badge code) + badge_translations (one row per locale).
-- Enums for category and criteria_type are bounded; thresholds are configurable per badge.
-- Seed mirrors the 6 hardcoded badges (codes + thresholds + ES/EN copy from src/dictionaries/*).
-- Adds nullable badge_id FK to student_badge_grants and backfills it for existing rows.
-- Public read for active rows + admin-only writes via RLS. Public catalog RPC for share page.
-- See ADR docs/adr/2026-04-student-badges-admin-catalog.md.

-- 1) Enums --------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_category') THEN
    CREATE TYPE public.badge_category AS ENUM ('tasks', 'attendance', 'profile', 'learning');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_criteria_type') THEN
    CREATE TYPE public.badge_criteria_type AS ENUM (
      'tasks_completed',
      'attendance_streak',
      'profile_complete',
      'assessments_passed'
    );
  END IF;
END $$;

-- 2) badge_catalog ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badge_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category public.badge_category NOT NULL,
  criteria_type public.badge_criteria_type NOT NULL,
  criteria_threshold INT NOT NULL DEFAULT 1,
  image_path TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT badge_catalog_code_len CHECK (char_length(code) BETWEEN 1 AND 64),
  CONSTRAINT badge_catalog_threshold_nonneg CHECK (criteria_threshold >= 0)
);

COMMENT ON TABLE public.badge_catalog IS
  'Admin-managed catalog of student badges. Public SELECT only when is_active=true. See ADR 2026-04-student-badges-admin-catalog.';

CREATE INDEX IF NOT EXISTS badge_catalog_active_sort_idx
  ON public.badge_catalog (is_active, sort_order, code);

CREATE OR REPLACE FUNCTION public.badge_catalog_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS badge_catalog_set_updated_at ON public.badge_catalog;
CREATE TRIGGER badge_catalog_set_updated_at
  BEFORE UPDATE ON public.badge_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.badge_catalog_set_updated_at();

-- 3) badge_translations -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badge_translations (
  badge_id UUID NOT NULL REFERENCES public.badge_catalog (id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'es')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 600),
  PRIMARY KEY (badge_id, locale)
);

COMMENT ON TABLE public.badge_translations IS
  'Per-locale title and description for a badge_catalog row. Public SELECT mirrors badge_catalog.is_active.';

CREATE INDEX IF NOT EXISTS badge_translations_badge_idx
  ON public.badge_translations (badge_id);

-- 4) student_badge_grants gains optional badge_id FK -------------------------
ALTER TABLE public.student_badge_grants
  ADD COLUMN IF NOT EXISTS badge_id UUID NULL REFERENCES public.badge_catalog (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS student_badge_grants_badge_id_idx
  ON public.student_badge_grants (badge_id);

-- 5) Seed the 6 currently-hardcoded badges ------------------------------------
-- Insert is idempotent (ON CONFLICT on UNIQUE code).
WITH inserted AS (
  INSERT INTO public.badge_catalog (code, category, criteria_type, criteria_threshold, sort_order)
  VALUES
    ('tasks_completed_1',       'tasks',      'tasks_completed',      1,  10),
    ('tasks_completed_5',       'tasks',      'tasks_completed',      5,  20),
    ('tasks_completed_10',      'tasks',      'tasks_completed',     10,  30),
    ('attendance_streak_5',     'attendance', 'attendance_streak',    5,  40),
    ('profile_complete',        'profile',    'profile_complete',     1,  50),
    ('first_assessment_passed', 'learning',   'assessments_passed',   1,  60)
  ON CONFLICT (code) DO NOTHING
  RETURNING id, code
)
INSERT INTO public.badge_translations (badge_id, locale, title, description)
SELECT i.id, t.locale, t.title, t.description
FROM inserted i
JOIN (
  VALUES
    ('tasks_completed_1', 'en', 'First task',
       'Mark your first learning task as completed in the student portal.'),
    ('tasks_completed_1', 'es', 'Primera tarea',
       'Marca tu primera tarea de aprendizaje como completada en el portal del alumno.'),
    ('tasks_completed_5', 'en', 'Five tasks',
       'Complete five learning tasks in total.'),
    ('tasks_completed_5', 'es', 'Cinco tareas',
       'Completa cinco tareas de aprendizaje en total.'),
    ('tasks_completed_10', 'en', 'Ten tasks',
       'Complete ten learning tasks in total.'),
    ('tasks_completed_10', 'es', 'Diez tareas',
       'Completa diez tareas de aprendizaje en total.'),
    ('attendance_streak_5', 'en', 'Five-day streak',
       'Attend class on five consecutive calendar days (present, late, or excused) without a break.'),
    ('attendance_streak_5', 'es', 'Racha de 5 días',
       'Asiste a clase cinco días corridos (presente, tarde o justificado) sin cortar la racha.'),
    ('profile_complete', 'en', 'Profile ready',
       'Add a phone number, your date of birth, and a profile photo.'),
    ('profile_complete', 'es', 'Perfil completo',
       'Agrega un teléfono, tu fecha de nacimiento y una foto de perfil.'),
    ('first_assessment_passed', 'en', 'Test passed',
       'Pass an assessed mini-test from your class.'),
    ('first_assessment_passed', 'es', 'Mini-test aprobado',
       'Aprueba un mini-test evaluado de tu clase.')
) AS t(code, locale, title, description) ON t.code = i.code;

-- 6) Backfill badge_id on existing grants -------------------------------------
UPDATE public.student_badge_grants g
SET    badge_id = c.id
FROM   public.badge_catalog c
WHERE  g.badge_id IS NULL
  AND  g.badge_code = c.code;

-- 7) RLS ---------------------------------------------------------------------
ALTER TABLE public.badge_catalog        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_translations   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS badge_catalog_select_active ON public.badge_catalog;
CREATE POLICY badge_catalog_select_active
  ON public.badge_catalog FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS badge_catalog_select_admin ON public.badge_catalog;
CREATE POLICY badge_catalog_select_admin
  ON public.badge_catalog FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS badge_catalog_all_admin ON public.badge_catalog;
CREATE POLICY badge_catalog_all_admin
  ON public.badge_catalog FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS badge_translations_select_active ON public.badge_translations;
CREATE POLICY badge_translations_select_active
  ON public.badge_translations FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.badge_catalog c
      WHERE c.id = badge_translations.badge_id AND c.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS badge_translations_select_admin ON public.badge_translations;
CREATE POLICY badge_translations_select_admin
  ON public.badge_translations FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS badge_translations_all_admin ON public.badge_translations;
CREATE POLICY badge_translations_all_admin
  ON public.badge_translations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 8) Public RPC: catalog entry by code (for share page + parent/student UI) --
-- Returns active catalog entry + ALL translations as a JSONB map.
-- SECURITY DEFINER so the share page can read it from anon without exposing the table.

CREATE OR REPLACE FUNCTION public.get_public_badge_catalog_entry(p_code text)
RETURNS TABLE (
  badge_id     uuid,
  code         text,
  category     public.badge_category,
  image_path   text,
  translations jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS badge_id,
    c.code,
    c.category,
    c.image_path,
    COALESCE(
      (
        SELECT jsonb_object_agg(
          t.locale,
          jsonb_build_object('title', t.title, 'description', t.description)
        )
        FROM public.badge_translations t
        WHERE t.badge_id = c.id
      ),
      '{}'::jsonb
    ) AS translations
  FROM public.badge_catalog c
  WHERE c.code = p_code
    AND c.is_active = TRUE
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_badge_catalog_entry(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_badge_catalog_entry(text)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_public_badge_catalog_entry(text) IS
  'Public catalog lookup by code (only active rows). Returns all translations as JSONB; safe for anon.';
