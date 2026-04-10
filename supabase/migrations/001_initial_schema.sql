-- Golden English — profiles, courses, enrollments, parent_student + RLS
-- SQL Editor o `supabase db push`. Idempotente (borra tablas/funcs/tipos y recrea).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Teardown: funcs (CASCADE quita triggers/RLS) → tablas → tipos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

DROP TABLE IF EXISTS public.parent_student CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.course_modality CASCADE;
DROP TYPE IF EXISTS public.cefr_level CASCADE;
DO $$
BEGIN
  BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE TYPE public.course_modality AS ENUM ('online', 'presencial');
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Tables --------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'student',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni_or_passport TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_dni_nonempty CHECK (length(trim(dni_or_passport)) > 0)
);

CREATE UNIQUE INDEX profiles_dni_or_passport_uidx ON public.profiles (lower(trim(dni_or_passport)));

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level public.cefr_level NOT NULL,
  modality public.course_modality NOT NULL DEFAULT 'online',
  academic_year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT courses_year_check CHECK (academic_year >= 2000 AND academic_year <= 2100)
);

CREATE UNIQUE INDEX courses_level_year_modality_uidx
  ON public.courses (level, academic_year, modality);

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

CREATE TABLE public.parent_student (
  parent_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, student_id),
  CONSTRAINT parent_student_distinct CHECK (parent_id <> student_id)
);

CREATE INDEX enrollments_student_id_idx ON public.enrollments (student_id);
CREATE INDEX enrollments_course_id_idx ON public.enrollments (course_id);
CREATE INDEX parent_student_student_id_idx ON public.parent_student (student_id);

-- updated_at ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auth → profiles ------------------------------------------------------------
-- Import masivo: pasar dni_or_passport, first_name, last_name, phone, birth_date en raw_user_meta_data.
-- Registros sin DNI (p. ej. OAuth) reciben pending-{uuid} — completar perfil después.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dni TEXT;
BEGIN
  v_dni := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'dni_or_passport', '')), '');
  IF v_dni IS NULL THEN
    v_dni := 'pending-' || replace(NEW.id::text, '-', '');
  END IF;

  INSERT INTO public.profiles (
    id, role, first_name, last_name, dni_or_passport, phone, birth_date
  )
  VALUES (
    NEW.id,
    'student',
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), '—'),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), '—'),
    v_dni,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'birth_date', '')), '')::date
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS helper -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = 'admin'
  );
$$;

-- RLS -----------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_insert_admin_only"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "profiles_delete_admin_only"
  ON public.profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "courses_select_authenticated"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courses_insert_admin"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "courses_update_admin"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "courses_delete_admin"
  ON public.courses FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "enrollments_select"
  ON public.enrollments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    OR EXISTS (SELECT 1 FROM public.parent_student ps WHERE ps.parent_id = auth.uid() AND ps.student_id = enrollments.student_id)
  );

CREATE POLICY "enrollments_insert_admin"
  ON public.enrollments FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "enrollments_update_admin"
  ON public.enrollments FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "enrollments_delete_admin"
  ON public.enrollments FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "parent_student_select"
  ON public.parent_student FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR parent_id = auth.uid()
    OR student_id = auth.uid()
  );

CREATE POLICY "parent_student_insert_admin"
  ON public.parent_student FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "parent_student_update_admin"
  ON public.parent_student FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "parent_student_delete_admin"
  ON public.parent_student FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Seed 2026 online CEFR ladder ----------------------------------------------
INSERT INTO public.courses (name, level, modality, academic_year)
VALUES
  ('Inglés General Online A1', 'A1', 'online', 2026),
  ('Inglés General Online A2', 'A2', 'online', 2026),
  ('Inglés General Online B1', 'B1', 'online', 2026),
  ('Inglés General Online B2', 'B2', 'online', 2026),
  ('Inglés General Online C1', 'C1', 'online', 2026),
  ('Inglés General Online C2', 'C2', 'online', 2026)
ON CONFLICT (level, academic_year, modality) DO NOTHING;

-- Bootstrap primer admin (reemplaza USER_UUID por el id de auth.users):
-- INSERT INTO public.profiles (id, role, first_name, last_name, dni_or_passport)
-- VALUES ('USER_UUID', 'admin', 'Nombre', 'Apellido', '00000000')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
