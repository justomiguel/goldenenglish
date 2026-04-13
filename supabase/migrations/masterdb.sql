-- WARNING: This file is for context only and is not meant to be run as one script.
-- It concatenates incremental migrations in numeric/filename order for quick review.
-- Real deployments must apply files under supabase/migrations/*.sql in order (not this bundle).
-- Regenerate: node scripts/generate-masterdb-from-migrations.mjs


-- ========== 001_initial_schema.sql ==========

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

-- ========== 002_platform_phase.sql ==========

-- Golden English — site settings, attendance, payments, registrations, storage
-- Run after 001_initial_schema.sql. Idempotent-safe: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

-- Enums ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'justified');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE public.registration_status AS ENUM ('new', 'contacted', 'enrolled');
  END IF;
END $$;

-- site_settings --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (key, value)
VALUES ('inscriptions_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Trigger: role only trusted when provisioned by admin (import / user mgmt)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dni TEXT;
  v_role public.user_role;
  v_role_raw TEXT;
  v_provision TEXT;
BEGIN
  v_dni := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'dni_or_passport', '')), '');
  IF v_dni IS NULL THEN
    v_dni := 'pending-' || replace(NEW.id::text, '-', '');
  END IF;

  v_provision := COALESCE(NEW.raw_user_meta_data ->> 'provisioning_source', '');
  v_role_raw := lower(nullif(trim(COALESCE(NEW.raw_user_meta_data ->> 'role', '')), ''));

  IF v_provision = 'admin_invite'
     AND v_role_raw IN ('admin', 'teacher', 'student', 'parent') THEN
    v_role := v_role_raw::public.user_role;
  ELSE
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (
    id, role, first_name, last_name, dni_or_passport, phone, birth_date
  )
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), '—'),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), '—'),
    v_dni,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'birth_date', '')), '')::date
  );
  RETURN NEW;
END;
$$;

-- attendance ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status public.attendance_status NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attendance_student_day_uidx UNIQUE (student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS attendance_student_date_idx
  ON public.attendance (student_id, attendance_date);

-- payments ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  amount NUMERIC(12, 2),
  status public.payment_status NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_student_period_uidx UNIQUE (student_id, month, year)
);

CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- registrations -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  level_interest TEXT,
  status public.registration_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registrations_status_idx ON public.registrations (status);

-- RLS -----------------------------------------------------------------------
-- Parents may read linked students’ profiles (names, etc.).
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = profiles.id
    )
  );

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;
CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (key = 'inscriptions_enabled');

DROP POLICY IF EXISTS site_settings_all_admin ON public.site_settings;
CREATE POLICY site_settings_all_admin
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select
  ON public.attendance FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = attendance.student_id
    )
  );

DROP POLICY IF EXISTS attendance_write_admin_teacher ON public.attendance;
CREATE POLICY attendance_write_admin_teacher
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
  );

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select
  ON public.payments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
  );

DROP POLICY IF EXISTS payments_insert_admin ON public.payments;
CREATE POLICY payments_insert_admin
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS payments_insert_parent ON public.payments;
CREATE POLICY payments_insert_parent
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = payments.student_id
    )
  );

DROP POLICY IF EXISTS payments_update_parent ON public.payments;
CREATE POLICY payments_update_parent
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = payments.student_id
    )
    AND (parent_id IS NULL OR parent_id = auth.uid())
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS payments_update_admin ON public.payments;
CREATE POLICY payments_update_admin
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS payments_delete_admin ON public.payments;
CREATE POLICY payments_delete_admin
  ON public.payments FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS registrations_insert_public ON public.registrations;
CREATE POLICY registrations_insert_public
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS registrations_select_admin ON public.registrations;
CREATE POLICY registrations_select_admin
  ON public.registrations FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS registrations_update_admin ON public.registrations;
CREATE POLICY registrations_update_admin
  ON public.registrations FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Storage: payment receipts --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS payment_receipts_insert ON storage.objects;
CREATE POLICY payment_receipts_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS payment_receipts_select_own ON storage.objects;
CREATE POLICY payment_receipts_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS payment_receipts_update_own ON storage.objects;
CREATE POLICY payment_receipts_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS payment_receipts_delete_own ON storage.objects;
CREATE POLICY payment_receipts_delete_own
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ========== 003_registrations_delete_policy.sql ==========

-- Allow admins to delete registration rows (e.g. spam or processed elsewhere).
DROP POLICY IF EXISTS registrations_delete_admin ON public.registrations;
CREATE POLICY registrations_delete_admin
  ON public.registrations FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== 004_registration_birth_and_profile_age.sql ==========

-- Public registration: store date of birth on the lead row.
-- Profiles: snapshot age in years (derived from birth_date on insert/update).

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.registrations.birth_date IS 'Date of birth from public form; used when enrolling the student.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_years INT;

COMMENT ON COLUMN public.profiles.age_years IS 'Age in full years, derived from birth_date when the row is written (not auto-aging daily).';

CREATE OR REPLACE FUNCTION public.profiles_set_age_years()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.birth_date IS NULL THEN
    NEW.age_years := NULL;
  ELSE
    NEW.age_years := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_age_years ON public.profiles;
CREATE TRIGGER profiles_set_age_years
  BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_age_years();

UPDATE public.profiles
SET age_years = EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::integer
WHERE birth_date IS NOT NULL;

-- ========== 005_student_portal_messages.sql ==========

-- Student portal: optional teacher assignment, student↔teacher messages, student payment receipt updates.
-- Run after 002_platform_phase.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_assigned_teacher_idx
  ON public.profiles (assigned_teacher_id);

CREATE TABLE IF NOT EXISTS public.student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reply_html TEXT,
  replied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS student_messages_student_idx
  ON public.student_messages (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_messages_teacher_idx
  ON public.student_messages (teacher_id, created_at DESC);

ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_messages_select ON public.student_messages;
CREATE POLICY student_messages_select ON public.student_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS student_messages_insert ON public.student_messages;
CREATE POLICY student_messages_insert ON public.student_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = teacher_id AND t.role = 'teacher')
  );

DROP POLICY IF EXISTS student_messages_teacher_update ON public.student_messages;
CREATE POLICY student_messages_teacher_update ON public.student_messages
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS student_messages_student_delete ON public.student_messages;
CREATE POLICY student_messages_student_delete ON public.student_messages
  FOR DELETE TO authenticated
  USING (
    student_id = auth.uid()
    AND reply_html IS NULL
  );

DROP POLICY IF EXISTS student_messages_admin_all ON public.student_messages;
CREATE POLICY student_messages_admin_all ON public.student_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Teachers may read basic profile rows for students they message with.
DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;
CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_messages m
      WHERE m.student_id = profiles.id AND m.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_update_student_own ON public.payments;
CREATE POLICY payments_update_student_own ON public.payments
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'student')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );

-- ========== 006_profiles_avatar_storage.sql ==========

-- Profile avatar: optional image path or external URL + private storage bucket

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS
  'Public https URL, or object path inside bucket avatars (e.g. userId/file.jpg).';

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_select_own ON storage.objects;
CREATE POLICY avatars_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_select_admin ON storage.objects;
CREATE POLICY avatars_select_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_admin(auth.uid())
  );

-- ========== 007_portal_messages.sql ==========

-- Unified portal messaging: role-based send/receive rules.
-- Replaces student_messages (student→teacher threads with reply_html on same row).

CREATE TABLE IF NOT EXISTS public.portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_messages_no_self CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS portal_messages_sender_idx
  ON public.portal_messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_messages_recipient_idx
  ON public.portal_messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_messages_pair_idx
  ON public.portal_messages (sender_id, recipient_id, created_at DESC);

-- Migrate legacy rows (student message + optional teacher reply as separate rows)
INSERT INTO public.portal_messages (id, sender_id, recipient_id, body_html, created_at)
SELECT id, student_id, teacher_id, body_html, created_at
FROM public.student_messages;

INSERT INTO public.portal_messages (sender_id, recipient_id, body_html, created_at)
SELECT teacher_id, student_id, reply_html, COALESCE(replied_at, created_at)
FROM public.student_messages
WHERE reply_html IS NOT NULL AND trim(reply_html) <> '';

ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_messages_select ON public.portal_messages;
CREATE POLICY portal_messages_select ON public.portal_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS portal_messages_insert_student ON public.portal_messages;
CREATE POLICY portal_messages_insert_student ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
  );

DROP POLICY IF EXISTS portal_messages_insert_teacher ON public.portal_messages;
CREATE POLICY portal_messages_insert_teacher ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
  );

DROP POLICY IF EXISTS portal_messages_insert_admin ON public.portal_messages;
CREATE POLICY portal_messages_insert_admin ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'admin')
  );

DROP POLICY IF EXISTS portal_messages_delete_student ON public.portal_messages;
CREATE POLICY portal_messages_delete_student ON public.portal_messages
  FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
    AND NOT EXISTS (
      SELECT 1 FROM public.portal_messages r
      WHERE r.sender_id = portal_messages.recipient_id
        AND r.recipient_id = portal_messages.sender_id
        AND r.created_at > portal_messages.created_at
    )
  );

DROP POLICY IF EXISTS student_messages_select ON public.student_messages;
DROP POLICY IF EXISTS student_messages_insert ON public.student_messages;
DROP POLICY IF EXISTS student_messages_teacher_update ON public.student_messages;
DROP POLICY IF EXISTS student_messages_student_delete ON public.student_messages;
DROP POLICY IF EXISTS student_messages_admin_all ON public.student_messages;

-- Must drop before student_messages: policy body references student_messages (005).
DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;

DROP TABLE IF EXISTS public.student_messages;

CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    AND EXISTS (SELECT 1 FROM public.profiles st WHERE st.id = profiles.id AND st.role = 'student')
    AND EXISTS (
      SELECT 1 FROM public.portal_messages m
      WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
         OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS profiles_select_teacher_for_messaging ON public.profiles;
CREATE POLICY profiles_select_teacher_for_messaging ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
    AND profiles.role IN ('student', 'teacher', 'admin')
  );

-- ========== 008_billing_scholarships_coupons.sql ==========

-- Scholarships (per student), discount coupons, payment.exempt status, optional coupon on payment.

DO $$
BEGIN
  ALTER TYPE public.payment_status ADD VALUE 'exempt';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.student_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  discount_percent NUMERIC(5, 2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  note TEXT,
  valid_from_year INT NOT NULL CHECK (valid_from_year >= 2000 AND valid_from_year <= 2100),
  valid_from_month INT NOT NULL CHECK (valid_from_month >= 1 AND valid_from_month <= 12),
  valid_until_year INT NULL CHECK (valid_until_year IS NULL OR (valid_until_year >= 2000 AND valid_until_year <= 2100)),
  valid_until_month INT NULL CHECK (valid_until_month IS NULL OR (valid_until_month >= 1 AND valid_until_month <= 12)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_scholarships_one_per_student UNIQUE (student_id)
);

DROP TRIGGER IF EXISTS student_scholarships_set_updated_at ON public.student_scholarships;
CREATE TRIGGER student_scholarships_set_updated_at
  BEFORE UPDATE ON public.student_scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NULL,
  max_uses INT NULL CHECK (max_uses IS NULL OR max_uses >= 0),
  uses_count INT NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS discount_coupons_code_lower_uidx ON public.discount_coupons (lower(trim(code)));

DROP TRIGGER IF EXISTS discount_coupons_set_updated_at ON public.discount_coupons;
CREATE TRIGGER discount_coupons_set_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.discount_coupons (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_coupon_idx ON public.payments (coupon_id);

ALTER TABLE public.student_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_scholarships_select ON public.student_scholarships;
CREATE POLICY student_scholarships_select ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = student_scholarships.student_id
    )
  );

DROP POLICY IF EXISTS student_scholarships_admin_all ON public.student_scholarships;
CREATE POLICY student_scholarships_admin_all ON public.student_scholarships
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_select ON public.discount_coupons;
CREATE POLICY discount_coupons_select ON public.discount_coupons
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_admin_write ON public.discount_coupons;
CREATE POLICY discount_coupons_admin_write ON public.discount_coupons
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_admin_update ON public.discount_coupons;
CREATE POLICY discount_coupons_admin_update ON public.discount_coupons
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_admin_delete ON public.discount_coupons;
CREATE POLICY discount_coupons_admin_delete ON public.discount_coupons
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== 009_enrollment_promotions_audit.sql ==========

-- Matrícula, motor de promociones, historial student_promotions, auditoría.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON public.audit_logs (actor_id, created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enrollment_fee_exempt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_authorized_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_enrollment_paid_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_kind TEXT NOT NULL DEFAULT 'monthly'
    CHECK (payment_kind IN ('monthly', 'enrollment'));

CREATE OR REPLACE FUNCTION public.protect_profile_enrollment_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.enrollment_fee_exempt IS DISTINCT FROM OLD.enrollment_fee_exempt
    OR NEW.enrollment_exempt_authorized_by IS DISTINCT FROM OLD.enrollment_exempt_authorized_by
    OR NEW.enrollment_exempt_at IS DISTINCT FROM OLD.enrollment_exempt_at
    OR NEW.enrollment_exempt_reason IS DISTINCT FROM OLD.enrollment_exempt_reason
    OR NEW.last_enrollment_paid_at IS DISTINCT FROM OLD.last_enrollment_paid_at
  THEN
    RAISE EXCEPTION 'Solo administradores pueden modificar datos de matrícula y exenciones';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enrollment_billing_guard ON public.profiles;
CREATE TRIGGER profiles_enrollment_billing_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_enrollment_billing_fields();

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('enrollment', 'monthly', 'both')),
  monthly_duration_months INT NULL CHECK (monthly_duration_months IS NULL OR monthly_duration_months >= 0),
  is_stackable BOOLEAN NOT NULL DEFAULT false,
  max_uses INT NULL CHECK (max_uses IS NULL OR max_uses >= 0),
  uses_count INT NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS promotions_code_lower_active_uidx
  ON public.promotions (lower(trim(code)))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS promotions_active_idx ON public.promotions (is_active, deleted_at, expires_at);

DROP TRIGGER IF EXISTS promotions_set_updated_at ON public.promotions;
CREATE TRIGGER promotions_set_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.student_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions (id) ON DELETE SET NULL,
  code_snapshot TEXT NOT NULL,
  promotion_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  applies_to_snapshot TEXT NOT NULL CHECK (applies_to_snapshot IN ('enrollment', 'monthly', 'both')),
  monthly_months_remaining INT NULL CHECK (monthly_months_remaining IS NULL OR monthly_months_remaining >= 0),
  enrollment_consumed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS student_promotions_student_idx ON public.student_promotions (student_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS student_promotions_promotion_idx ON public.student_promotions (promotion_id);

CREATE OR REPLACE FUNCTION public.increment_promotion_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.promotion_id IS NOT NULL THEN
    UPDATE public.promotions
    SET uses_count = uses_count + 1
    WHERE id = NEW.promotion_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_promotions_usage ON public.student_promotions;
CREATE TRIGGER student_promotions_usage
  AFTER INSERT ON public.student_promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_promotion_usage();

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS audit_logs_admin_insert ON public.audit_logs;
CREATE POLICY audit_logs_admin_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND actor_id = auth.uid());

DROP POLICY IF EXISTS promotions_admin_all ON public.promotions;
CREATE POLICY promotions_admin_all ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS student_promotions_select ON public.student_promotions;
CREATE POLICY student_promotions_select ON public.student_promotions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = student_promotions.student_id
    )
  );

DROP POLICY IF EXISTS student_promotions_insert ON public.student_promotions;
CREATE POLICY student_promotions_insert ON public.student_promotions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_promotion_code(p_code text)
RETURNS TABLE (
  ok boolean,
  message text,
  promotion_id uuid,
  discount_type text,
  discount_value numeric,
  applies_to text,
  monthly_duration_months int,
  is_stackable boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.promotions%ROWTYPE;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN QUERY SELECT false, 'Empty code'::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::int, NULL::boolean;
    RETURN;
  END IF;

  SELECT * INTO r FROM public.promotions p
  WHERE lower(trim(p.code)) = lower(trim(p_code))
    AND p.deleted_at IS NULL
    AND p.is_active = true
    AND p.valid_from <= now()
    AND (p.expires_at IS NULL OR p.expires_at > now());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or inactive promotion'::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::int, NULL::boolean;
    RETURN;
  END IF;

  IF r.max_uses IS NOT NULL AND r.uses_count >= r.max_uses THEN
    RETURN QUERY SELECT false, 'Promotion usage limit reached'::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::int, NULL::boolean;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    'OK'::text,
    r.id,
    r.discount_type,
    r.discount_value,
    r.applies_to,
    r.monthly_duration_months,
    r.is_stackable;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_promotion_code(p_student_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_promo public.promotions%ROWTYPE;
  v_new_id uuid;
  v_snapshot jsonb;
  v_monthly_remaining int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated');
  END IF;

  IF NOT (
    v_uid = p_student_id
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = v_uid AND ps.student_id = p_student_id
    )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Forbidden');
  END IF;

  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Empty code');
  END IF;

  SELECT * INTO v_promo FROM public.promotions p
  WHERE lower(trim(p.code)) = lower(trim(p_code))
    AND p.deleted_at IS NULL
    AND p.is_active = true
    AND p.valid_from <= now()
    AND (p.expires_at IS NULL OR p.expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid or inactive promotion');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Promotion usage limit reached');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.student_promotions sp
    WHERE sp.student_id = p_student_id
      AND (
        (
          v_promo.applies_to IN ('enrollment', 'both')
          AND sp.applies_to_snapshot IN ('enrollment', 'both')
          AND NOT sp.enrollment_consumed
        )
        OR (
          v_promo.applies_to IN ('monthly', 'both')
          AND sp.applies_to_snapshot IN ('monthly', 'both')
          AND (sp.monthly_months_remaining IS NULL OR sp.monthly_months_remaining > 0)
        )
      )
      AND (
        NOT v_promo.is_stackable
        OR NOT COALESCE((sp.promotion_snapshot->>'is_stackable')::boolean, false)
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Another promotion is already active for this benefit');
  END IF;

  v_snapshot := jsonb_build_object(
    'name', v_promo.name,
    'description', v_promo.description,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'is_stackable', v_promo.is_stackable,
    'applies_to', v_promo.applies_to,
    'monthly_duration_months', v_promo.monthly_duration_months
  );

  IF v_promo.applies_to IN ('monthly', 'both') THEN
    v_monthly_remaining := v_promo.monthly_duration_months;
  ELSE
    v_monthly_remaining := NULL;
  END IF;

  INSERT INTO public.student_promotions (
    student_id,
    promotion_id,
    code_snapshot,
    promotion_snapshot,
    applied_by,
    applies_to_snapshot,
    monthly_months_remaining
  )
  VALUES (
    p_student_id,
    v_promo.id,
    trim(p_code),
    v_snapshot,
    v_uid,
    v_promo.applies_to,
    v_monthly_remaining
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'ok', true,
    'student_promotion_id', v_new_id,
    'promotion_id', v_promo.id,
    'promotion_name', v_promo.name,
    'code_snapshot', trim(p_code)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promotion_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_promotion_code(uuid, text) TO authenticated;

-- ========== 010_analytics_observability.sql ==========

-- Analytics (user_events), engagement, churn fields, immutable system_config_audit.

DO $$
BEGIN
  CREATE TYPE public.user_event_type AS ENUM (
    'page_view',
    'click',
    'action',
    'session_start'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_type public.user_event_type NOT NULL,
  entity TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_events_user_created_idx
  ON public.user_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_type_created_idx
  ON public.user_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_entity_created_idx
  ON public.user_events (entity, created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_session_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS engagement_points INT NOT NULL DEFAULT 0
    CHECK (engagement_points >= 0);

CREATE TABLE IF NOT EXISTS public.system_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_config_audit_created_idx
  ON public.system_config_audit (created_at DESC);

CREATE OR REPLACE FUNCTION public.user_events_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  SELECT role::text INTO r FROM public.profiles WHERE id = NEW.user_id;
  IF r IS NULL OR r <> 'student' THEN
    RETURN NEW;
  END IF;
  IF NEW.event_type = 'session_start' THEN
    UPDATE public.profiles
    SET last_session_start_at = NEW.created_at,
        churn_notified_at = NULL
    WHERE id = NEW.user_id;
  END IF;
  IF NEW.event_type = 'page_view' AND NEW.entity LIKE 'material:%' THEN
    UPDATE public.profiles
    SET engagement_points = engagement_points + 5
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_events_engagement ON public.user_events;
CREATE TRIGGER user_events_engagement
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.user_events_after_insert();

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_events_insert_own ON public.user_events;
CREATE POLICY user_events_insert_own ON public.user_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_events_select_admin ON public.user_events;
CREATE POLICY user_events_select_admin ON public.user_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS system_config_audit_admin_select ON public.system_config_audit;
CREATE POLICY system_config_audit_admin_select ON public.system_config_audit
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS system_config_audit_admin_insert ON public.system_config_audit;
CREATE POLICY system_config_audit_admin_insert ON public.system_config_audit
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.admin_analytics_hourly_by_role(p_days int)
RETURNS TABLE (hour int, role text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM ue.created_at AT TIME ZONE 'America/Argentina/Cordoba')::int AS hour,
    p.role::text,
    COUNT(*)::bigint AS cnt
  FROM public.user_events ue
  JOIN public.profiles p ON p.id = ue.user_id
  WHERE ue.created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_analytics_geo(p_days int)
RETURNS TABLE (country text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(ue.metadata->>'geo_country', 'unknown') AS country,
    COUNT(*)::bigint AS cnt
  FROM public.user_events ue
  WHERE ue.created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 40;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_analytics_section_funnel(p_days int)
RETURNS TABLE (section text, viewers bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    ue.entity AS section,
    COUNT(DISTINCT ue.user_id)::bigint AS viewers
  FROM public.user_events ue
  WHERE ue.created_at >= now() - (p_days || ' days')::interval
    AND ue.event_type = 'page_view'
    AND ue.entity LIKE 'section:%'
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 30;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_analytics_hourly_by_role(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_analytics_geo(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_analytics_section_funnel(int) TO authenticated;

-- ========== 011_minor_tutor_relations.sql ==========

-- Menores / tutores: is_minor, tutor_student_rel (reemplaza parent_student), campos tutor en registrations,
-- eventos portal para padres, auditoría de vínculos, políticas RLS actualizadas.

-- Edad legal (DB; alinear con system.properties en despliegue)
INSERT INTO public.site_settings (key, value)
VALUES ('legal_age_of_majority', '18'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.legal_age_of_majority()
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT (value #>> '{}')::int FROM public.site_settings WHERE key = 'legal_age_of_majority'),
    18
  );
$$;

-- is_minor + columnas académicas / transición a facturación adulta
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_minor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_exam_at DATE,
  ADD COLUMN IF NOT EXISTS student_portal_next_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_portal_next_event_label TEXT,
  ADD COLUMN IF NOT EXISTS billing_adult_transition_pending BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_minor IS 'True when age from birth_date is below legal_age_of_majority (recomputed on birth_date changes).';
COMMENT ON COLUMN public.profiles.billing_adult_transition_pending IS 'Admin: alumno alcanzó mayoría o requiere revisión de quién gestiona pagos.';

CREATE OR REPLACE FUNCTION public.profiles_set_age_years()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_age int;
  v_legal int;
  v_was_minor boolean;
BEGIN
  v_legal := public.legal_age_of_majority();
  IF TG_OP = 'UPDATE' THEN
    v_was_minor := COALESCE(OLD.is_minor, false);
  ELSE
    v_was_minor := false;
  END IF;

  IF NEW.birth_date IS NULL THEN
    NEW.age_years := NULL;
    NEW.is_minor := false;
  ELSE
    v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;
    NEW.age_years := v_age;
    NEW.is_minor := v_age < v_legal;
    IF TG_OP = 'UPDATE' AND v_was_minor AND NOT NEW.is_minor THEN
      NEW.billing_adult_transition_pending := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_age_years ON public.profiles;
CREATE TRIGGER profiles_set_age_years
  BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_age_years();

UPDATE public.profiles
SET birth_date = birth_date
WHERE birth_date IS NOT NULL;

-- Registrations: datos del tutor cuando el lead es menor (validación principal en app)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS tutor_name TEXT,
  ADD COLUMN IF NOT EXISTS tutor_dni TEXT,
  ADD COLUMN IF NOT EXISTS tutor_phone TEXT,
  ADD COLUMN IF NOT EXISTS tutor_email TEXT,
  ADD COLUMN IF NOT EXISTS tutor_relationship TEXT;

-- tutor_student_rel (antes parent_student)
CREATE TABLE IF NOT EXISTS public.tutor_student_rel (
  tutor_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  relationship TEXT,
  linked_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tutor_id, student_id),
  CONSTRAINT tutor_student_distinct CHECK (tutor_id <> student_id)
);

CREATE INDEX IF NOT EXISTS tutor_student_rel_student_idx
  ON public.tutor_student_rel (student_id);

INSERT INTO public.tutor_student_rel (tutor_id, student_id, created_at)
SELECT parent_id, student_id, created_at
FROM public.parent_student
ON CONFLICT (tutor_id, student_id) DO NOTHING;

-- Auditoría de vínculos tutor–alumno
CREATE OR REPLACE FUNCTION public.audit_tutor_student_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (
      COALESCE(NEW.linked_by, auth.uid()),
      'tutor_student_link',
      'tutor_student_rel',
      NEW.student_id,
      jsonb_build_object(
        'tutor_id', NEW.tutor_id,
        'student_id', NEW.student_id,
        'relationship', NEW.relationship
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tutor_student_rel_audit ON public.tutor_student_rel;
CREATE TRIGGER tutor_student_rel_audit
  AFTER INSERT ON public.tutor_student_rel
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tutor_student_insert();

DROP TABLE IF EXISTS public.parent_student CASCADE;

ALTER TABLE public.tutor_student_rel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tutor_student_rel_select ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_select
  ON public.tutor_student_rel FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR tutor_id = auth.uid()
    OR student_id = auth.uid()
  );

DROP POLICY IF EXISTS tutor_student_rel_insert_admin ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_insert_admin
  ON public.tutor_student_rel FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS tutor_student_rel_update_admin ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_update_admin
  ON public.tutor_student_rel FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS tutor_student_rel_delete_admin ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_delete_admin
  ON public.tutor_student_rel FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Perfiles: padres/tutores leen alumnos vinculados
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
  );

-- Inscripciones
DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select
  ON public.enrollments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = enrollments.student_id
    )
  );

-- Asistencia
DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select
  ON public.attendance FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = attendance.student_id
    )
  );

-- Pagos
DROP POLICY IF EXISTS payments_insert_parent ON public.payments;
CREATE POLICY payments_insert_parent
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = payments.student_id
    )
  );

DROP POLICY IF EXISTS payments_update_parent ON public.payments;
CREATE POLICY payments_update_parent
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = payments.student_id
    )
    AND (parent_id IS NULL OR parent_id = auth.uid())
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND status = 'pending'
  );

-- Becas / promociones (tablas de migraciones 008 y 009; opcional si el proyecto aún no las aplicó)
DO $schol$
BEGIN
  IF to_regclass('public.student_scholarships') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS student_scholarships_select ON public.student_scholarships';
    EXECUTE $pol$
CREATE POLICY student_scholarships_select ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_scholarships.student_id
    )
  );
$pol$;
  END IF;
END $schol$;

DO $promo$
BEGIN
  IF to_regclass('public.student_promotions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS student_promotions_select ON public.student_promotions';
    EXECUTE $pol$
CREATE POLICY student_promotions_select ON public.student_promotions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_promotions.student_id
    )
  );
$pol$;
  END IF;
END $promo$;

-- RPC de promociones (requiere migración 009: promotions + student_promotions)
DO $apply_migration_011$
BEGIN
  IF to_regclass('public.promotions') IS NOT NULL
     AND to_regclass('public.student_promotions') IS NOT NULL THEN
    EXECUTE $fn$
CREATE OR REPLACE FUNCTION public.apply_promotion_code(p_student_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fb$
DECLARE
  v_uid uuid := auth.uid();
  v_promo public.promotions%ROWTYPE;
  v_new_id uuid;
  v_snapshot jsonb;
  v_monthly_remaining int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated');
  END IF;

  IF NOT (
    v_uid = p_student_id
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = v_uid AND ts.student_id = p_student_id
    )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Forbidden');
  END IF;

  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Empty code');
  END IF;

  SELECT * INTO v_promo FROM public.promotions p
  WHERE lower(trim(p.code)) = lower(trim(p_code))
    AND p.deleted_at IS NULL
    AND p.is_active = true
    AND p.valid_from <= now()
    AND (p.expires_at IS NULL OR p.expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid or inactive promotion');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Promotion usage limit reached');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.student_promotions sp
    WHERE sp.student_id = p_student_id
      AND (
        (
          v_promo.applies_to IN ('enrollment', 'both')
          AND sp.applies_to_snapshot IN ('enrollment', 'both')
          AND NOT sp.enrollment_consumed
        )
        OR (
          v_promo.applies_to IN ('monthly', 'both')
          AND sp.applies_to_snapshot IN ('monthly', 'both')
          AND (sp.monthly_months_remaining IS NULL OR sp.monthly_months_remaining > 0)
        )
      )
      AND (
        NOT v_promo.is_stackable
        OR NOT COALESCE((sp.promotion_snapshot->>'is_stackable')::boolean, false)
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Another promotion is already active for this benefit');
  END IF;

  v_snapshot := jsonb_build_object(
    'name', v_promo.name,
    'description', v_promo.description,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'is_stackable', v_promo.is_stackable,
    'applies_to', v_promo.applies_to,
    'monthly_duration_months', v_promo.monthly_duration_months
  );

  IF v_promo.applies_to IN ('monthly', 'both') THEN
    v_monthly_remaining := v_promo.monthly_duration_months;
  ELSE
    v_monthly_remaining := NULL;
  END IF;

  INSERT INTO public.student_promotions (
    student_id,
    promotion_id,
    code_snapshot,
    promotion_snapshot,
    applied_by,
    applies_to_snapshot,
    monthly_months_remaining
  )
  VALUES (
    p_student_id,
    v_promo.id,
    trim(p_code),
    v_snapshot,
    v_uid,
    v_promo.applies_to,
    v_monthly_remaining
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'ok', true,
    'student_promotion_id', v_new_id,
    'promotion_id', v_promo.id,
    'promotion_name', v_promo.name,
    'code_snapshot', trim(p_code)
  );
END;
$fb$;
$fn$;
  END IF;
END $apply_migration_011$;

-- Recomputar edad / menoría (cron diario; cumpleaños a mitad de año)
CREATE OR REPLACE FUNCTION public.profiles_recompute_minor_flags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET
    age_years = EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::integer,
    is_minor = EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::integer < public.legal_age_of_majority(),
    billing_adult_transition_pending = CASE
      WHEN p.is_minor = true
        AND EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::integer >= public.legal_age_of_majority()
      THEN true
      ELSE p.billing_adult_transition_pending
    END
  WHERE p.birth_date IS NOT NULL;
END;
$$;

-- ========== 012_is_current_user_admin.sql ==========

-- Exposed RPC for server/client to detect admin without relying only on SELECT under RLS.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- ========== 013_traffic_page_hits.sql ==========

-- Raw page impressions (authenticated, guests, bots) for traffic analytics.

DO $$
BEGIN
  CREATE TYPE public.traffic_visitor_kind AS ENUM (
    'authenticated',
    'guest',
    'bot'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.traffic_page_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_kind public.traffic_visitor_kind NOT NULL,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  pathname TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  geo_country TEXT,
  geo_region TEXT,
  client_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT traffic_page_hits_pathname_len CHECK (char_length(pathname) <= 2048)
);

CREATE INDEX IF NOT EXISTS traffic_page_hits_created_idx
  ON public.traffic_page_hits (created_at DESC);
CREATE INDEX IF NOT EXISTS traffic_page_hits_kind_created_idx
  ON public.traffic_page_hits (visitor_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS traffic_page_hits_geo_created_idx
  ON public.traffic_page_hits (geo_country, created_at DESC);

ALTER TABLE public.traffic_page_hits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS traffic_page_hits_admin_select ON public.traffic_page_hits;
CREATE POLICY traffic_page_hits_admin_select ON public.traffic_page_hits
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Inserts only from server with service role (no INSERT policy for clients).

CREATE OR REPLACE FUNCTION public.admin_traffic_summary(p_days int)
RETURNS TABLE (
  authenticated_hits bigint,
  guest_hits bigint,
  bot_hits bigint,
  total_hits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE t.visitor_kind = 'authenticated')::bigint,
    COUNT(*) FILTER (WHERE t.visitor_kind = 'guest')::bigint,
    COUNT(*) FILTER (WHERE t.visitor_kind = 'bot')::bigint,
    COUNT(*)::bigint
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_traffic_daily_stacked(p_days int)
RETURNS TABLE (
  day date,
  authenticated_hits bigint,
  guest_hits bigint,
  bot_hits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH today AS (
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date AS d
  ),
  days AS (
    SELECT generate_series(
      (SELECT d FROM today) - p_days,
      (SELECT d FROM today),
      interval '1 day'
    )::date AS day
  ),
  agg AS (
    SELECT
      (t.created_at AT TIME ZONE 'America/Argentina/Cordoba')::date AS dday,
      COUNT(*) FILTER (WHERE t.visitor_kind = 'authenticated')::bigint AS ah,
      COUNT(*) FILTER (WHERE t.visitor_kind = 'guest')::bigint AS gh,
      COUNT(*) FILTER (WHERE t.visitor_kind = 'bot')::bigint AS bh
    FROM public.traffic_page_hits t
    WHERE t.created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    d.day,
    COALESCE(a.ah, 0)::bigint,
    COALESCE(a.gh, 0)::bigint,
    COALESCE(a.bh, 0)::bigint
  FROM days d
  LEFT JOIN agg a ON a.dday = d.day
  ORDER BY d.day;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_summary(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_traffic_daily_stacked(int) TO authenticated;

-- ========== 014_admin_traffic_geo_totals.sql ==========

-- Country totals from traffic_page_hits (edge geo, ISO alpha-2) for admin choropleth.

CREATE OR REPLACE FUNCTION public.admin_traffic_geo_totals(p_days int)
RETURNS TABLE (country text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    upper(trim(t.geo_country)) AS country,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.geo_country IS NOT NULL
    AND btrim(t.geo_country) <> ''
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 250;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_geo_totals(int) TO authenticated;

-- ========== 014_profiles_update_linked_student_by_tutor.sql ==========

-- Padre/tutor autenticado puede actualizar perfiles de alumnos vinculados (rol sigue siendo student).

DROP POLICY IF EXISTS profiles_update_linked_student_by_tutor ON public.profiles;

CREATE POLICY profiles_update_linked_student_by_tutor
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
    AND profiles.role = 'student'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
    AND role = 'student'
  );

-- ========== 015_profiles_minor_blocks_self_sensitive_updates.sql ==========

-- Block self-service updates to sensitive profile fields for minors who have a tutor link.
-- Tutor/parent updates remain governed by RLS (e.g. 014). Login email lives in auth.users and is not covered here.

CREATE OR REPLACE FUNCTION public.profiles_block_minor_self_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM NEW.id THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM 'student'::public.user_role THEN
    RETURN NEW;
  END IF;

  IF NOT COALESCE(NEW.is_minor, false) THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tutor_student_rel ts
    WHERE ts.student_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  IF (NEW.first_name IS DISTINCT FROM OLD.first_name)
    OR (NEW.last_name IS DISTINCT FROM OLD.last_name)
    OR (NEW.phone IS DISTINCT FROM OLD.phone)
    OR (NEW.birth_date IS DISTINCT FROM OLD.birth_date)
    OR (NEW.dni_or_passport IS DISTINCT FROM OLD.dni_or_passport)
  THEN
    RAISE EXCEPTION 'minor_profile_self_edit_forbidden'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_z_block_minor_self_sensitive_update ON public.profiles;
CREATE TRIGGER profiles_z_block_minor_self_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_block_minor_self_sensitive_update();

COMMENT ON FUNCTION public.profiles_block_minor_self_sensitive_update() IS
  'Runs after profiles_set_age_years (name z > s): prevents linked minors from changing identity fields on their own row.';

-- ========== 016_portal_messages_messaging_rules.sql ==========

-- Portal messaging rules:
-- parent → teacher (linked ward has assigned_teacher_id = recipient)
-- student → teacher (unchanged)
-- teacher → student | parent | teacher | admin
-- admin → student | parent | teacher | admin
-- Teachers can load parent profiles for compose + threads.

DROP POLICY IF EXISTS portal_messages_insert_teacher ON public.portal_messages;
CREATE POLICY portal_messages_insert_teacher ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.profiles r
      WHERE r.id = recipient_id
        AND r.role IN ('student', 'parent', 'teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS portal_messages_insert_admin ON public.portal_messages;
CREATE POLICY portal_messages_insert_admin ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'admin')
    AND EXISTS (
      SELECT 1 FROM public.profiles r
      WHERE r.id = recipient_id
        AND r.role IN ('student', 'parent', 'teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'parent')
    AND EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      JOIN public.profiles st ON st.id = ts.student_id
      WHERE ts.tutor_id = auth.uid()
        AND st.assigned_teacher_id = recipient_id
    )
  );

DROP POLICY IF EXISTS profiles_select_teacher_for_messaging ON public.profiles;
CREATE POLICY profiles_select_teacher_for_messaging ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
    AND profiles.role IN ('student', 'parent', 'teacher', 'admin')
  );

DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;
CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.profiles peer
      WHERE peer.id = profiles.id AND peer.role IN ('student', 'parent')
    )
    AND EXISTS (
      SELECT 1 FROM public.portal_messages m
      WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
         OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS profiles_select_teachers_assigned_to_tutored_students ON public.profiles;
CREATE POLICY profiles_select_teachers_assigned_to_tutored_students ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent')
    AND profiles.role = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      JOIN public.profiles st ON st.id = ts.student_id
      WHERE ts.tutor_id = auth.uid()
        AND st.assigned_teacher_id = profiles.id
    )
  );

-- ========== 017_academic_cohorts_sections.sql ==========

-- Academic cohorts, sections (schedule JSON), section enrollments (historical statuses),
-- transfer requests (teacher -> admin). RPC for atomic enroll + optional drop.

DO $$
BEGIN
  CREATE TYPE public.section_enrollment_status AS ENUM (
    'active',
    'completed',
    'transferred',
    'dropped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.section_transfer_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.academic_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.academic_cohorts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  schedule_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_students INT NULL CHECK (max_students IS NULL OR max_students > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academic_sections_cohort_idx
  ON public.academic_sections (cohort_id);
CREATE INDEX IF NOT EXISTS academic_sections_teacher_idx
  ON public.academic_sections (teacher_id);

CREATE TABLE IF NOT EXISTS public.section_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.section_enrollment_status NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS section_enrollments_active_unique
  ON public.section_enrollments (section_id, student_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS section_enrollments_student_idx
  ON public.section_enrollments (student_id);
CREATE INDEX IF NOT EXISTS section_enrollments_section_idx
  ON public.section_enrollments (section_id);

CREATE TABLE IF NOT EXISTS public.section_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  from_section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  to_section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.section_transfer_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_transfer_requests_distinct_sections
    CHECK (from_section_id <> to_section_id)
);

CREATE INDEX IF NOT EXISTS section_transfer_requests_status_idx
  ON public.section_transfer_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS academic_cohorts_set_updated_at ON public.academic_cohorts;
CREATE TRIGGER academic_cohorts_set_updated_at
  BEFORE UPDATE ON public.academic_cohorts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS academic_sections_set_updated_at ON public.academic_sections;
CREATE TRIGGER academic_sections_set_updated_at
  BEFORE UPDATE ON public.academic_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS section_enrollments_set_updated_at ON public.section_enrollments;
CREATE TRIGGER section_enrollments_set_updated_at
  BEFORE UPDATE ON public.section_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Schedule overlap (JSON arrays of { dayOfWeek, startTime, endTime } strings)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.academic_time_to_minutes(t TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (split_part(trim(t), ':', 1))::INT * 60
    + NULLIF(trim(split_part(trim(t), ':', 2)), '')::INT,
    -1
  );
$$;

CREATE OR REPLACE FUNCTION public.academic_json_slots_overlap(a JSONB, b JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  xa JSONB;
  xb JSONB;
  da INT;
  db INT;
  sa INT;
  ea INT;
  sb INT;
  eb INT;
BEGIN
  IF a IS NULL OR b IS NULL THEN
    RETURN false;
  END IF;
  FOR xa IN SELECT jsonb_array_elements(COALESCE(a, '[]'::jsonb))
  LOOP
    da := COALESCE((xa ->> 'dayOfWeek')::INT, -1);
    sa := public.academic_time_to_minutes(xa ->> 'startTime');
    ea := public.academic_time_to_minutes(xa ->> 'endTime');
    IF da < 0 OR sa < 0 OR ea < 0 OR sa >= ea THEN
      CONTINUE;
    END IF;
    FOR xb IN SELECT jsonb_array_elements(COALESCE(b, '[]'::jsonb))
    LOOP
      db := COALESCE((xb ->> 'dayOfWeek')::INT, -1);
      sb := public.academic_time_to_minutes(xb ->> 'startTime');
      eb := public.academic_time_to_minutes(xb ->> 'endTime');
      IF db < 0 OR sb < 0 OR eb < 0 OR sb >= eb THEN
        CONTINUE;
      END IF;
      IF da = db AND sa < eb AND sb < ea THEN
        RETURN true;
      END IF;
    END LOOP;
  END LOOP;
  RETURN false;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic admin enroll (+ optional drop active row) with capacity + overlap
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.academic_admin_section_enroll_commit(
  p_student_id UUID,
  p_section_id UUID,
  p_drop_section_enrollment_id UUID,
  p_drop_next_status TEXT,
  p_allow_capacity_override BOOLEAN,
  p_default_max_students INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_max INT;
  v_cnt INT;
  v_target_slots JSONB;
  v_row RECORD;
  v_new_id UUID;
  v_next public.section_enrollment_status;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ACADEMIC_NOT_ADMIN';
  END IF;

  IF p_default_max_students IS NULL OR p_default_max_students < 1 THEN
    RAISE EXCEPTION 'ACADEMIC_BAD_DEFAULT_MAX';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.section_enrollments e
    WHERE e.section_id = p_section_id
      AND e.student_id = p_student_id
      AND e.status = 'active'
      AND (
        p_drop_section_enrollment_id IS NULL
        OR e.id <> p_drop_section_enrollment_id
      )
  ) THEN
    RAISE EXCEPTION 'ACADEMIC_ALREADY_ACTIVE_IN_SECTION';
  END IF;

  SELECT schedule_slots, COALESCE(max_students, p_default_max_students)
  INTO v_target_slots, v_max
  FROM public.academic_sections
  WHERE id = p_section_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACADEMIC_SECTION_NOT_FOUND';
  END IF;

  SELECT count(*)::INT
  INTO v_cnt
  FROM public.section_enrollments
  WHERE section_id = p_section_id AND status = 'active';

  IF v_cnt >= v_max AND NOT COALESCE(p_allow_capacity_override, false) THEN
    RAISE EXCEPTION 'ACADEMIC_CAPACITY_EXCEEDED';
  END IF;

  IF p_drop_section_enrollment_id IS NOT NULL THEN
    IF lower(COALESCE(p_drop_next_status, 'dropped')) = 'transferred' THEN
      v_next := 'transferred';
    ELSE
      v_next := 'dropped';
    END IF;

    UPDATE public.section_enrollments e
    SET status = v_next, updated_at = now()
    WHERE e.id = p_drop_section_enrollment_id
      AND e.student_id = p_student_id
      AND e.status = 'active';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACADEMIC_DROP_INVALID';
    END IF;
  END IF;

  FOR v_row IN
    SELECT s.schedule_slots AS slots
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE e.student_id = p_student_id
      AND e.status = 'active'
      AND e.section_id <> p_section_id
      AND (
        p_drop_section_enrollment_id IS NULL
        OR e.id <> p_drop_section_enrollment_id
      )
  LOOP
    IF public.academic_json_slots_overlap(v_target_slots, v_row.slots) THEN
      RAISE EXCEPTION 'ACADEMIC_SCHEDULE_OVERLAP';
    END IF;
  END LOOP;

  INSERT INTO public.section_enrollments (section_id, student_id, status)
  VALUES (p_section_id, p_student_id, 'active')
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'enrollment_id', v_new_id::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.academic_admin_section_enroll_commit(
  UUID, UUID, UUID, TEXT, BOOLEAN, INT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.academic_json_slots_overlap(JSONB, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.academic_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_transfer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_cohorts_select_auth ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_auth ON public.academic_cohorts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS academic_cohorts_admin_write ON public.academic_cohorts;
CREATE POLICY academic_cohorts_admin_write ON public.academic_cohorts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = academic_sections.id
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

DROP POLICY IF EXISTS academic_sections_admin_write ON public.academic_sections;
CREATE POLICY academic_sections_admin_write ON public.academic_sections
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_enrollments_select_scope ON public.section_enrollments;
CREATE POLICY section_enrollments_select_scope ON public.section_enrollments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = section_enrollments.student_id
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_enrollments.section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_enrollments_admin_write ON public.section_enrollments;
CREATE POLICY section_enrollments_admin_write ON public.section_enrollments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_transfer_requests_select ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_select ON public.section_transfer_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR requested_by = auth.uid()
  );

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = from_section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_transfer_requests_admin_update ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_admin_update ON public.section_transfer_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_transfer_requests_admin_delete ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_admin_delete ON public.section_transfer_requests
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== 017_fix_profiles_rls_recursion.sql ==========

-- Fix: infinite recursion in profiles RLS policies (42P17).
--
-- Several SELECT policies on `profiles` contain subqueries like
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
-- which re-trigger the same SELECT policies → infinite recursion.
--
-- Solution: a generic SECURITY DEFINER helper `user_has_role(uid, role_name)` that
-- bypasses RLS (like the existing `is_admin`), and rewrite every self-referencing
-- policy on `profiles` to use it instead of inline subqueries.

-- 1. Generic role check (SECURITY DEFINER = bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.user_has_role(uid uuid, r text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = r::public.user_role
  );
$$;

COMMENT ON FUNCTION public.user_has_role(uuid, text) IS
  'SECURITY DEFINER: checks profiles.role without triggering RLS on profiles. Use in RLS policies that reference the same table.';

-- Helper: read a single column from a profile row bypassing RLS.
-- Needed for policies that check the *target* row''s role or teacher assignment.
CREATE OR REPLACE FUNCTION public.profile_role(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role::text FROM public.profiles p WHERE p.id = uid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.profile_assigned_teacher(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.assigned_teacher_id FROM public.profiles p WHERE p.id = uid LIMIT 1;
$$;

-- 2. Rewrite self-referencing SELECT policies on profiles ---------------------

-- profiles_select_teacher_for_messaging (from 016): teacher can see all profiles for compose.
DROP POLICY IF EXISTS profiles_select_teacher_for_messaging ON public.profiles;
CREATE POLICY profiles_select_teacher_for_messaging ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'teacher')
    AND profiles.role IN ('student', 'parent', 'teacher', 'admin')
  );

-- profiles_select_teacher_via_messages (from 016): teacher sees student/parent profiles
-- they've exchanged portal_messages with.
DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;
CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'teacher')
    AND public.profile_role(profiles.id) IN ('student', 'parent')
    AND EXISTS (
      SELECT 1 FROM public.portal_messages m
      WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
         OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid())
    )
  );

-- profiles_select_teachers_assigned_to_tutored_students (from 016):
-- parents see teacher profiles linked through their tutored students' assigned_teacher_id.
DROP POLICY IF EXISTS profiles_select_teachers_assigned_to_tutored_students ON public.profiles;
CREATE POLICY profiles_select_teachers_assigned_to_tutored_students ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'parent')
    AND profiles.role = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND public.profile_assigned_teacher(ts.student_id) = profiles.id
    )
  );

-- 3. Policies on OTHER tables that had inline profiles subqueries (not recursive
--    on profiles, but cleaner/safer to use the helper too) --------------------

-- portal_messages INSERT: teacher, admin, parent checks
DROP POLICY IF EXISTS portal_messages_insert_teacher ON public.portal_messages;
CREATE POLICY portal_messages_insert_teacher ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'teacher')
    AND public.profile_role(recipient_id) IN ('student', 'parent', 'teacher', 'admin')
  );

DROP POLICY IF EXISTS portal_messages_insert_admin ON public.portal_messages;
CREATE POLICY portal_messages_insert_admin ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'admin')
    AND public.profile_role(recipient_id) IN ('student', 'parent', 'teacher', 'admin')
  );

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'parent')
    AND public.profile_role(recipient_id) = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND public.profile_assigned_teacher(ts.student_id) = recipient_id
    )
  );

-- enrollments_select (from 011): teacher check was inline
DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select
  ON public.enrollments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = enrollments.student_id
    )
  );

-- attendance_select (from 011): teacher check was inline
DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select
  ON public.attendance FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = attendance.student_id
    )
  );

-- payments_update_student_own (from 005): student check was inline
DROP POLICY IF EXISTS payments_update_student_own ON public.payments;
CREATE POLICY payments_update_student_own ON public.payments
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
    AND public.user_has_role(auth.uid(), 'student')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );

-- ========== 018_teacher_transfer_reason_peer_sections.sql ==========

-- Structured reason for transfer metrics + teacher read of peer sections in same cohort
-- (so a teacher can suggest moves to another section they do not teach).

ALTER TABLE public.section_transfer_requests
  ADD COLUMN IF NOT EXISTS reason_code text;

COMMENT ON COLUMN public.section_transfer_requests.reason_code IS
  'Teacher suggestion category: academic_level, schedule, behavior, other (validated in app).';

DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = academic_sections.id
        AND e.status = 'active'
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_sections mine
      WHERE mine.cohort_id = academic_sections.cohort_id
        AND mine.teacher_id = auth.uid()
        AND public.user_has_role(auth.uid(), 'teacher')
    )
  );

-- ========== 019_academic_rls_tutor_student_rel.sql ==========

-- Academic RLS: tutor_student_rel replaced parent_student in migration 011.
-- Restores parent/tutor visibility for sections, enrollments, and transfer outcomes.

DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = academic_sections.id
        AND e.status = 'active'
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_sections mine
      WHERE mine.cohort_id = academic_sections.cohort_id
        AND mine.teacher_id = auth.uid()
        AND public.user_has_role(auth.uid(), 'teacher')
    )
  );

DROP POLICY IF EXISTS section_enrollments_select_scope ON public.section_enrollments;
CREATE POLICY section_enrollments_select_scope ON public.section_enrollments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = section_enrollments.student_id
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_enrollments.section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_transfer_requests_select ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_select ON public.section_transfer_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR requested_by = auth.uid()
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = section_transfer_requests.student_id
    )
  );

-- ========== 020_section_attendance_grades_retention.sql ==========

-- Section-scoped attendance & grades (per section_enrollment), retention alerts.
-- Distinct from legacy public.attendance (student_id + global date).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_attendance_status') THEN
    CREATE TYPE public.section_attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.section_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  attended_on DATE NOT NULL,
  status public.section_attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_attendance_enrollment_day_uidx UNIQUE (enrollment_id, attended_on)
);

CREATE INDEX IF NOT EXISTS section_attendance_section_day_idx
  ON public.section_attendance (enrollment_id, attended_on DESC);

CREATE TABLE IF NOT EXISTS public.section_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  score NUMERIC(6, 2) NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback_text TEXT,
  rubric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS section_grades_enrollment_idx
  ON public.section_grades (enrollment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.retention_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS retention_alerts_status_created_idx
  ON public.retention_alerts (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.enrollment_retention_flags (
  enrollment_id UUID PRIMARY KEY REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  watch BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS section_attendance_set_updated_at ON public.section_attendance;
CREATE TRIGGER section_attendance_set_updated_at
  BEFORE UPDATE ON public.section_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.section_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_retention_flags ENABLE ROW LEVEL SECURITY;

-- Helper: enrollment belongs to section taught by teacher
CREATE OR REPLACE FUNCTION public.section_enrollment_teacher_is_self(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE e.id = p_enrollment_id AND s.teacher_id = auth.uid()
  );
$$;

-- section_attendance
DROP POLICY IF EXISTS section_attendance_select_scope ON public.section_attendance;
CREATE POLICY section_attendance_select_scope ON public.section_attendance
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = section_attendance.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  );

DROP POLICY IF EXISTS section_attendance_admin_delete ON public.section_attendance;
CREATE POLICY section_attendance_admin_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- section_grades
DROP POLICY IF EXISTS section_grades_select_scope ON public.section_grades;
CREATE POLICY section_grades_select_scope ON public.section_grades
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = section_grades.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS section_grades_teacher_insert ON public.section_grades;
CREATE POLICY section_grades_teacher_insert ON public.section_grades
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS section_grades_teacher_update ON public.section_grades;
CREATE POLICY section_grades_teacher_update ON public.section_grades
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id));

DROP POLICY IF EXISTS section_grades_admin_delete ON public.section_grades;
CREATE POLICY section_grades_admin_delete ON public.section_grades
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- retention_alerts
DROP POLICY IF EXISTS retention_alerts_select ON public.retention_alerts;
CREATE POLICY retention_alerts_select ON public.retention_alerts
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = retention_alerts.student_id
    )
  );

DROP POLICY IF EXISTS retention_alerts_teacher_insert ON public.retention_alerts;
CREATE POLICY retention_alerts_teacher_insert ON public.retention_alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  );

DROP POLICY IF EXISTS retention_alerts_admin_update ON public.retention_alerts;
CREATE POLICY retention_alerts_admin_update ON public.retention_alerts
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- enrollment_retention_flags
DROP POLICY IF EXISTS enrollment_retention_flags_select ON public.enrollment_retention_flags;
CREATE POLICY enrollment_retention_flags_select ON public.enrollment_retention_flags
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
  );

DROP POLICY IF EXISTS enrollment_retention_flags_teacher_upsert ON public.enrollment_retention_flags;
CREATE POLICY enrollment_retention_flags_teacher_upsert ON public.enrollment_retention_flags
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
    )
  );

DROP POLICY IF EXISTS enrollment_retention_flags_teacher_update ON public.enrollment_retention_flags;
CREATE POLICY enrollment_retention_flags_teacher_update ON public.enrollment_retention_flags
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.section_enrollment_teacher_is_self(enrollment_id));

-- ========== 021_retention_grade_average_view.sql ==========

-- Aggregated section grades per enrollment (admin retention / reports).
-- security_invoker: RLS on underlying section_grades applies to invoker.

CREATE OR REPLACE VIEW public.v_section_enrollment_grade_average
WITH (security_invoker = true) AS
SELECT
  enrollment_id,
  ROUND(AVG(score)::numeric, 2) AS avg_score,
  COUNT(*)::bigint AS grade_count
FROM public.section_grades
GROUP BY enrollment_id;

COMMENT ON VIEW public.v_section_enrollment_grade_average IS
  'Mean score per section enrollment for retention dashboards; RLS from section_grades.';

-- ========== 022_section_attendance_operational.sql ==========

-- Operational attendance: configurable no-class days + teacher edit window (RLS).

CREATE TABLE IF NOT EXISTS public.academic_no_class_days (
  on_date DATE PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.academic_no_class_days IS
  'Calendar days without regular classes (holidays). Admins maintain; teachers see warnings in UI.';

ALTER TABLE public.academic_no_class_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_no_class_days_select ON public.academic_no_class_days;
CREATE POLICY academic_no_class_days_select ON public.academic_no_class_days
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS academic_no_class_days_admin_write ON public.academic_no_class_days;
CREATE POLICY academic_no_class_days_admin_write ON public.academic_no_class_days
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Teachers may only insert/update attendance for the last ~48h window (inclusive: today and two prior calendar days).
DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

-- ========== 023_cohort_assessments_and_enrollment_grades.sql ==========

-- Cohort-level assessments + per-enrollment rubric grades (draft / published).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_assessment_grade_status') THEN
    CREATE TYPE public.enrollment_assessment_grade_status AS ENUM ('draft', 'published');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cohort_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.academic_cohorts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assessment_on DATE NOT NULL,
  max_score NUMERIC(6, 2) NOT NULL CHECK (max_score > 0 AND max_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cohort_assessments_cohort_idx
  ON public.cohort_assessments (cohort_id, assessment_on DESC);

CREATE TABLE IF NOT EXISTS public.enrollment_assessment_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.cohort_assessments (id) ON DELETE CASCADE,
  score NUMERIC(6, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  rubric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  teacher_feedback TEXT,
  status public.enrollment_assessment_grade_status NOT NULL DEFAULT 'draft',
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollment_assessment_grades_uidx UNIQUE (enrollment_id, assessment_id)
);

CREATE INDEX IF NOT EXISTS enrollment_assessment_grades_assessment_idx
  ON public.enrollment_assessment_grades (assessment_id, status);

DROP TRIGGER IF EXISTS enrollment_assessment_grades_set_updated_at ON public.enrollment_assessment_grades;
CREATE TRIGGER enrollment_assessment_grades_set_updated_at
  BEFORE UPDATE ON public.enrollment_assessment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.cohort_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_assessment_grades ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enrollment_assessment_in_teacher_cohort(p_enrollment_id UUID, p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    JOIN public.cohort_assessments a ON a.cohort_id = s.cohort_id
    WHERE e.id = p_enrollment_id
      AND a.id = p_assessment_id
      AND s.teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.cohort_assessment_teacher_can_see(p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cohort_assessments ca
    JOIN public.academic_sections s ON s.cohort_id = ca.cohort_id
    WHERE ca.id = p_assessment_id
      AND s.teacher_id = auth.uid()
  );
$$;

-- cohort_assessments
DROP POLICY IF EXISTS cohort_assessments_select_scope ON public.cohort_assessments;
CREATE POLICY cohort_assessments_select_scope ON public.cohort_assessments
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.cohort_assessment_teacher_can_see(id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      JOIN public.academic_sections s ON s.id = e.section_id
      WHERE s.cohort_id = cohort_assessments.cohort_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS cohort_assessments_admin_write ON public.cohort_assessments;
CREATE POLICY cohort_assessments_admin_write ON public.cohort_assessments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS cohort_assessments_teacher_insert ON public.cohort_assessments;
CREATE POLICY cohort_assessments_teacher_insert ON public.cohort_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.cohort_id = cohort_assessments.cohort_id
        AND s.teacher_id = auth.uid()
    )
  );

-- enrollment_assessment_grades
DROP POLICY IF EXISTS enrollment_assessment_grades_select_scope ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_select_scope ON public.enrollment_assessment_grades
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.section_enrollment_teacher_is_self(enrollment_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.id = enrollment_assessment_grades.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS enrollment_assessment_grades_teacher_insert ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_teacher_insert ON public.enrollment_assessment_grades
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.enrollment_assessment_in_teacher_cohort(enrollment_id, assessment_id)
      AND updated_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS enrollment_assessment_grades_teacher_update ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_teacher_update ON public.enrollment_assessment_grades
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.enrollment_assessment_in_teacher_cohort(enrollment_id, assessment_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.enrollment_assessment_in_teacher_cohort(enrollment_id, assessment_id));

DROP POLICY IF EXISTS enrollment_assessment_grades_admin_delete ON public.enrollment_assessment_grades;
CREATE POLICY enrollment_assessment_grades_admin_delete ON public.enrollment_assessment_grades
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== 024_academic_cohort_rubric_dimensions.sql ==========

-- Optional cohort-level rubric template: JSON array of dimensions.
-- enrollment_assessment_grades.rubric_data remains JSONB key-value (dimension key -> numeric score).

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS rubric_dimensions JSONB;

COMMENT ON COLUMN public.academic_cohorts.rubric_dimensions IS
  'Optional JSON array: [{ "key": "fluency", "label": "Fluidez", "scaleMin": 1, "scaleMax": 5 }, ...]. Keys must match rubric_data object keys.';

-- ========== 025_billing_invoices_and_receipts.sql ==========

-- Structured billing: invoices + receipt submissions (manual reconciliation).
-- Coexists with legacy public.payments (monthly rows). MercadoPago-ready external_reference_id on invoices.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_invoice_status') THEN
    CREATE TYPE public.billing_invoice_status AS ENUM ('pending', 'verifying', 'paid', 'overdue', 'voided');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_receipt_status') THEN
    CREATE TYPE public.billing_receipt_status AS ENUM ('pending_approval', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_rejection_reason_code') THEN
    CREATE TYPE public.billing_rejection_reason_code AS ENUM (
      'image_blurry',
      'amount_mismatch',
      'wrong_account',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status public.billing_invoice_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  external_reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_invoices_student_status_idx
  ON public.billing_invoices (student_id, status);

CREATE INDEX IF NOT EXISTS billing_invoices_due_idx
  ON public.billing_invoices (due_date);

DROP TRIGGER IF EXISTS billing_invoices_set_updated_at ON public.billing_invoices;
CREATE TRIGGER billing_invoices_set_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.billing_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices (id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  receipt_storage_path TEXT NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
  status public.billing_receipt_status NOT NULL DEFAULT 'pending_approval',
  rejection_reason_code public.billing_rejection_reason_code,
  rejection_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_receipts_invoice_status_idx
  ON public.billing_receipts (invoice_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS billing_receipt_one_pending_per_invoice
  ON public.billing_receipts (invoice_id)
  WHERE status = 'pending_approval';

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_receipts ENABLE ROW LEVEL SECURITY;

-- Invoices: admin full access
DROP POLICY IF EXISTS billing_invoices_admin_all ON public.billing_invoices;
CREATE POLICY billing_invoices_admin_all ON public.billing_invoices
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Student sees own; tutor sees linked ward invoices
DROP POLICY IF EXISTS billing_invoices_select_scope ON public.billing_invoices;
CREATE POLICY billing_invoices_select_scope ON public.billing_invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = billing_invoices.student_id
    )
  );

DROP POLICY IF EXISTS billing_invoices_update_responsible ON public.billing_invoices;
CREATE POLICY billing_invoices_update_responsible ON public.billing_invoices
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = billing_invoices.student_id
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = billing_invoices.student_id
    )
  );

-- Receipts: mirror invoice access
DROP POLICY IF EXISTS billing_receipts_admin_all ON public.billing_receipts;
CREATE POLICY billing_receipts_admin_all ON public.billing_receipts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS billing_receipts_select_scope ON public.billing_receipts;
CREATE POLICY billing_receipts_select_scope ON public.billing_receipts
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.billing_invoices inv
      WHERE inv.id = billing_receipts.invoice_id
        AND (
          inv.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = inv.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS billing_receipts_insert_responsible ON public.billing_receipts;
CREATE POLICY billing_receipts_insert_responsible ON public.billing_receipts
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.billing_invoices inv
      WHERE inv.id = invoice_id
        AND (
          inv.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = inv.student_id
          )
        )
    )
  );

-- Approve: atomic receipt + invoice (SECURITY DEFINER; admin-only inside)
CREATE OR REPLACE FUNCTION public.admin_approve_billing_receipt(p_receipt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
  END IF;

  UPDATE public.billing_receipts
  SET status = 'approved', rejection_reason_code = NULL, rejection_detail = NULL
  WHERE id = p_receipt_id AND status = 'pending_approval'
  RETURNING invoice_id INTO v_inv;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  UPDATE public.billing_invoices
  SET status = 'paid', updated_at = now()
  WHERE id = v_inv;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_billing_receipt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_billing_receipt(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_billing_receipt(
  p_receipt_id UUID,
  p_code public.billing_rejection_reason_code,
  p_detail TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv UUID;
  v_due DATE;
  v_next public.billing_invoice_status;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
  END IF;

  UPDATE public.billing_receipts
  SET
    status = 'rejected',
    rejection_reason_code = p_code,
    rejection_detail = NULLIF(trim(COALESCE(p_detail, '')), '')
  WHERE id = p_receipt_id AND status = 'pending_approval'
  RETURNING invoice_id INTO v_inv;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  SELECT due_date INTO v_due FROM public.billing_invoices WHERE id = v_inv;

  v_next := CASE WHEN v_due < CURRENT_DATE THEN 'overdue'::public.billing_invoice_status ELSE 'pending'::public.billing_invoice_status END;

  UPDATE public.billing_invoices
  SET status = v_next, updated_at = now()
  WHERE id = v_inv;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_billing_receipt(UUID, public.billing_rejection_reason_code, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_billing_receipt(UUID, public.billing_rejection_reason_code, TEXT) TO authenticated;

-- Storage: admins may read any receipt in payment-receipts (signed URLs use service role today; policy supports user JWT too)
DROP POLICY IF EXISTS payment_receipts_select_admin ON storage.objects;
CREATE POLICY payment_receipts_select_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.is_admin(auth.uid())
  );

-- ========== 026_cohort_is_current_and_cleanup.sql ==========

-- Phase 1: explicit is_current flag on cohorts + retention view migration.

-- 1. is_current on academic_cohorts (at most one true at a time)
ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS academic_cohorts_one_current
  ON public.academic_cohorts (is_current) WHERE is_current = true;

-- Helper: returns the current cohort id or NULL.
CREATE OR REPLACE FUNCTION public.get_current_cohort_id()
RETURNS UUID
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT id FROM public.academic_cohorts WHERE is_current = true LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_cohort_id() TO authenticated;

-- 2. Retention view: switch from section_grades to enrollment_assessment_grades (published only).
CREATE OR REPLACE VIEW public.v_section_enrollment_grade_average
WITH (security_invoker = true) AS
SELECT
  enrollment_id,
  ROUND(AVG(score)::numeric, 2) AS avg_score,
  COUNT(*)::bigint AS grade_count
FROM public.enrollment_assessment_grades
WHERE status = 'published'
GROUP BY enrollment_id;

COMMENT ON VIEW public.v_section_enrollment_grade_average IS
  'Mean published assessment score per section enrollment for retention dashboards.';