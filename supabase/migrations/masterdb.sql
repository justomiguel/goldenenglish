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

-- ========== 027_academic_sections_rls_no_recursion.sql ==========

-- Fix: infinite recursion in policy for relation "academic_sections" (42P17).
--
-- peer-teacher visibility used:
--   EXISTS (SELECT 1 FROM public.academic_sections mine WHERE mine.cohort_id = academic_sections.cohort_id ...)
-- which re-evaluates RLS on academic_sections for the inner rows → infinite recursion.
--
-- Solution: SECURITY DEFINER helper (same pattern as user_has_role for profiles in 017_fix_profiles_rls_recursion.sql).

CREATE OR REPLACE FUNCTION public.teacher_teaches_cohort(p_teacher_id uuid, p_cohort_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.teacher_id = p_teacher_id
  );
$$;

COMMENT ON FUNCTION public.teacher_teaches_cohort(uuid, uuid) IS
  'SECURITY DEFINER: cohort/s teacher membership without re-entering academic_sections RLS.';

GRANT EXECUTE ON FUNCTION public.teacher_teaches_cohort(uuid, uuid) TO authenticated;

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
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.teacher_teaches_cohort(auth.uid(), academic_sections.cohort_id)
    )
  );

-- ========== 028_academic_sections_rls_break_enrollment_cycle.sql ==========

-- Fix 42P17: second recursion cycle between academic_sections and section_enrollments.
--
-- academic_sections_select_scope uses EXISTS (section_enrollments …).
-- section_enrollments_select_scope used EXISTS (academic_sections s WHERE s.id = section_id …).
-- Those mutual subqueries re-enter RLS → infinite recursion (even when enrollment count is 0,
-- the planner still ties the policies together).
--
-- section_transfer_requests_teacher_insert also used EXISTS (academic_sections …) and can feed the same cycle.
--
-- cohort_assessments_teacher_insert: replace direct EXISTS on academic_sections with teacher_teaches_cohort
-- (from 027) to avoid redundant self-joins in policies.

CREATE OR REPLACE FUNCTION public.section_teacher_id(p_section_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.teacher_id
  FROM public.academic_sections s
  WHERE s.id = p_section_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.section_teacher_id(uuid) IS
  'SECURITY DEFINER: read academic_sections.teacher_id without enrollment/section RLS ping-pong.';

GRANT EXECUTE ON FUNCTION public.section_teacher_id(uuid) TO authenticated;

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
    OR public.section_teacher_id(section_enrollments.section_id) = auth.uid()
  );

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.user_has_role(auth.uid(), 'teacher')
    AND public.section_teacher_id(from_section_id) = auth.uid()
  );

DROP POLICY IF EXISTS cohort_assessments_teacher_insert ON public.cohort_assessments;
CREATE POLICY cohort_assessments_teacher_insert ON public.cohort_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_role(auth.uid(), 'teacher')
    AND public.teacher_teaches_cohort(auth.uid(), cohort_assessments.cohort_id)
  );

-- ========== 029_registrations_preferred_section.sql ==========

-- Public registration: preferred academic section (current cohort) instead of free-text "level".

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS preferred_section_id UUID REFERENCES public.academic_sections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_preferred_section_idx
  ON public.registrations (preferred_section_id)
  WHERE preferred_section_id IS NOT NULL;

COMMENT ON COLUMN public.registrations.preferred_section_id IS
  'Section the applicant selected on the public form (must belong to the current cohort).';

-- Label for storing level_interest display + validation that the id is allowed for public signup.
CREATE OR REPLACE FUNCTION public.registration_public_section_label(p_section_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name || ' — ' || s.name
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE s.id = p_section_id
    AND c.is_current = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.registration_public_section_label(uuid) IS
  'Returns cohort — section label if the section is in the current cohort; else NULL (invalid for public registration).';

GRANT EXECUTE ON FUNCTION public.registration_public_section_label(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_section_label(uuid) TO authenticated;

-- Options for <select> on /register (anon-safe list).
CREATE OR REPLACE FUNCTION public.list_registration_section_options()
RETURNS TABLE (id uuid, label text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         c.name || ' — ' || s.name AS label
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE c.is_current = true
  ORDER BY c.name, s.name;
$$;

COMMENT ON FUNCTION public.list_registration_section_options() IS
  'Sections offered for public enrollment (current cohort only).';

GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO authenticated;

-- FK insert on registrations.preferred_section_id must pass RLS on academic_sections (PostgreSQL FK check).
-- Allow anon to read only cohorts/sections that are offered for public signup (current cohort).
DROP POLICY IF EXISTS academic_cohorts_select_public_current ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_public_current ON public.academic_cohorts
  FOR SELECT TO anon
  USING (is_current = true);

DROP POLICY IF EXISTS academic_sections_select_public_registration ON public.academic_sections;
CREATE POLICY academic_sections_select_public_registration ON public.academic_sections
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.academic_cohorts c
      WHERE c.id = academic_sections.cohort_id
        AND c.is_current = true
    )
  );

-- ========== 030_admin_hub_profile_counts_rpc.sql ==========

-- RPC: profile counts by role + students without active section enrollment.
-- Replaces the full profiles scan in loadAdminHubSummary (Rule 13 compliance).

CREATE OR REPLACE FUNCTION public.admin_hub_profile_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_counts AS (
    SELECT role::text AS role, count(*)::int AS cnt
    FROM public.profiles
    WHERE role IS NOT NULL
    GROUP BY role
  ),
  total AS (
    SELECT coalesce(sum(cnt), 0)::int AS total FROM role_counts
  ),
  students_without_section AS (
    SELECT count(*)::int AS cnt
    FROM public.profiles p
    WHERE p.role = 'student'
      AND NOT EXISTS (
        SELECT 1 FROM public.section_enrollments se
        WHERE se.student_id = p.id
          AND se.status = 'active'
      )
  )
  SELECT jsonb_build_object(
    'total', (SELECT total FROM total),
    'by_role', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('role', role, 'count', cnt) ORDER BY cnt DESC)
       FROM role_counts),
      '[]'::jsonb
    ),
    'students_without_section', (SELECT cnt FROM students_without_section)
  );
$$;

COMMENT ON FUNCTION public.admin_hub_profile_counts() IS
  'Aggregated profile counts by role + students without active section enrollment for admin hub.';

REVOKE ALL ON FUNCTION public.admin_hub_profile_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_hub_profile_counts() TO authenticated;

-- ========== 031_admin_traffic_geo_path_breakdown.sql ==========

-- Top (country, pathname) pairs from traffic_page_hits for admin analytics (bounded).

CREATE OR REPLACE FUNCTION public.admin_traffic_geo_path_breakdown(p_days int, p_limit int DEFAULT 500)
RETURNS TABLE (country text, pathname text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 500), 2000);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    upper(trim(t.geo_country)) AS country,
    t.pathname,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.geo_country IS NOT NULL
    AND btrim(t.geo_country) <> ''
  GROUP BY 1, 2
  ORDER BY 3 DESC, 1, 2
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_geo_path_breakdown(int, int) TO authenticated;

CREATE INDEX IF NOT EXISTS traffic_page_hits_geo_path_created_idx
  ON public.traffic_page_hits (geo_country, pathname, created_at DESC);

-- ========== 032_admin_traffic_guest_path_breakdown.sql ==========

-- Top pathnames for guest (no session) hits — admin traffic analytics.

CREATE OR REPLACE FUNCTION public.admin_traffic_guest_path_breakdown(p_days int, p_limit int DEFAULT 500)
RETURNS TABLE (pathname text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 500), 2000);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    t.pathname,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.visitor_kind = 'guest'::public.traffic_visitor_kind
  GROUP BY t.pathname
  ORDER BY cnt DESC, pathname
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_guest_path_breakdown(int, int) TO authenticated;

CREATE INDEX IF NOT EXISTS traffic_page_hits_guest_path_created_idx
  ON public.traffic_page_hits (visitor_kind, pathname, created_at DESC);

-- ========== 033_academic_cohort_section_archive.sql ==========

-- Operational soft-archive for cohorts and sections (admin-driven "baja").
-- Non-admin readers lose visibility; public registration helpers ignore archived rows.

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS academic_cohorts_archived_idx
  ON public.academic_cohorts (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS academic_sections_archived_idx
  ON public.academic_sections (archived_at)
  WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN public.academic_cohorts.archived_at IS
  'When set, cohort is hidden from non-admin operational reads until restored.';

COMMENT ON COLUMN public.academic_sections.archived_at IS
  'When set, section is hidden from non-admin operational reads until restored.';

-- Peer-teacher cohort visibility: only active (non-archived) sections count.
CREATE OR REPLACE FUNCTION public.teacher_teaches_cohort(p_teacher_id uuid, p_cohort_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.teacher_id = p_teacher_id
      AND s.archived_at IS NULL
  );
$$;

-- Public registration options: current cohort only, both cohort and section active.
CREATE OR REPLACE FUNCTION public.list_registration_section_options()
RETURNS TABLE (id uuid, label text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         c.name || ' — ' || s.name AS label
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE c.is_current = true
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
  ORDER BY c.name, s.name;
$$;

CREATE OR REPLACE FUNCTION public.registration_public_section_label(p_section_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name || ' — ' || s.name
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE s.id = p_section_id
    AND c.is_current = true
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
  LIMIT 1;
$$;

-- Authenticated cohort reads: admins see everything; others only non-archived cohorts.
DROP POLICY IF EXISTS academic_cohorts_select_auth ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_auth ON public.academic_cohorts
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.academic_cohorts.archived_at IS NULL
  );

-- Anon public registration: current + not archived.
DROP POLICY IF EXISTS academic_cohorts_select_public_current ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_public_current ON public.academic_cohorts
  FOR SELECT TO anon
  USING (is_current = true AND archived_at IS NULL);

DROP POLICY IF EXISTS academic_sections_select_public_registration ON public.academic_sections;
CREATE POLICY academic_sections_select_public_registration ON public.academic_sections
  FOR SELECT TO anon
  USING (
    academic_sections.archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.academic_cohorts c
      WHERE c.id = academic_sections.cohort_id
        AND c.is_current = true
        AND c.archived_at IS NULL
    )
  );

-- Section reads: admins bypass archive; everyone else only non-archived sections.
DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      academic_sections.archived_at IS NULL
      AND (
        teacher_id = auth.uid()
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
        OR (
          public.user_has_role(auth.uid(), 'teacher')
          AND public.teacher_teaches_cohort(auth.uid(), academic_sections.cohort_id)
        )
      )
    )
  );

-- ========== 034_academic_section_starts_ends.sql ==========

-- Operational window per section (within cohort, validated in app).

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS starts_on DATE,
  ADD COLUMN IF NOT EXISTS ends_on DATE;

UPDATE public.academic_sections s
SET
  starts_on = COALESCE(s.starts_on, c.starts_on, CURRENT_DATE),
  ends_on = COALESCE(
    s.ends_on,
    c.ends_on,
    COALESCE(s.starts_on, c.starts_on, CURRENT_DATE)
  )
FROM public.academic_cohorts c
WHERE s.cohort_id = c.id
  AND (s.starts_on IS NULL OR s.ends_on IS NULL);

UPDATE public.academic_sections
SET ends_on = starts_on
WHERE ends_on IS NULL;

UPDATE public.academic_sections
SET starts_on = ends_on
WHERE starts_on IS NULL;

ALTER TABLE public.academic_sections
  ALTER COLUMN starts_on SET NOT NULL,
  ALTER COLUMN ends_on SET NOT NULL;

ALTER TABLE public.academic_sections
  DROP CONSTRAINT IF EXISTS academic_sections_dates_order_chk;

ALTER TABLE public.academic_sections
  ADD CONSTRAINT academic_sections_dates_order_chk
  CHECK (starts_on <= ends_on);

COMMENT ON COLUMN public.academic_sections.starts_on IS
  'First day the section runs (calendar date; compare to cohort.starts_on/ends_on in app).';

COMMENT ON COLUMN public.academic_sections.ends_on IS
  'Last day the section runs (inclusive).';

-- ========== 035_academic_section_assistants_and_staff.sql ==========

-- Section lead (teacher_id) remains the canonical owner; optional assistants (same cohort tools).
-- RLS: assistants read sections/enrollments like the lead where policies used section_teacher_id / teacher-only checks.

CREATE TABLE IF NOT EXISTS public.academic_section_assistants (
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT academic_section_assistants_pkey PRIMARY KEY (section_id, assistant_id)
);

CREATE INDEX IF NOT EXISTS academic_section_assistants_assistant_idx
  ON public.academic_section_assistants (assistant_id);

COMMENT ON TABLE public.academic_section_assistants IS
  'Additional teachers with access to the section roster, attendance, and grades (not the lead teacher_id).';

ALTER TABLE public.academic_section_assistants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_section_assistants_select_scope ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_select_scope ON public.academic_section_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR assistant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_id AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS academic_section_assistants_admin_insert ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_admin_insert ON public.academic_section_assistants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_section_assistants_admin_delete ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_admin_delete ON public.academic_section_assistants
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Lead or assistant: used in enrollment / transfer policies (avoids recursion on academic_sections).
CREATE OR REPLACE FUNCTION public.user_leads_or_assists_section(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academic_sections s
    WHERE s.id = p_section_id AND s.teacher_id = p_uid
  )
  OR EXISTS (
    SELECT 1 FROM public.academic_section_assistants a
    WHERE a.section_id = p_section_id AND a.assistant_id = p_uid
  );
$$;

COMMENT ON FUNCTION public.user_leads_or_assists_section(uuid, uuid) IS
  'True if the user is the section lead teacher or listed as an assistant (SECURITY DEFINER; bypasses section RLS).';

GRANT EXECUTE ON FUNCTION public.user_leads_or_assists_section(uuid, uuid) TO authenticated;

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
    OR public.user_leads_or_assists_section(auth.uid(), section_enrollments.section_id)
  );

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.user_has_role(auth.uid(), 'teacher')
    AND public.user_leads_or_assists_section(auth.uid(), from_section_id)
  );

-- Section reads: assistants see active sections they assist (same non-admin rules as lead).
DROP POLICY IF EXISTS academic_sections_select_scope ON public.academic_sections;
CREATE POLICY academic_sections_select_scope ON public.academic_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      academic_sections.archived_at IS NULL
      AND (
        teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.academic_section_assistants a
          WHERE a.section_id = academic_sections.id
            AND a.assistant_id = auth.uid()
        )
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
        OR (
          public.user_has_role(auth.uid(), 'teacher')
          AND public.teacher_teaches_cohort(auth.uid(), academic_sections.cohort_id)
        )
      )
    )
  );

CREATE OR REPLACE FUNCTION public.teacher_teaches_cohort(p_teacher_id uuid, p_cohort_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL
      AND (
        s.teacher_id = p_teacher_id
        OR EXISTS (
          SELECT 1 FROM public.academic_section_assistants a
          WHERE a.section_id = s.id AND a.assistant_id = p_teacher_id
        )
      )
  );
$$;

-- Attendance / grades: assistants may read/write rows for enrollments in sections they assist.
CREATE OR REPLACE FUNCTION public.section_enrollment_teacher_is_self(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollments e
    JOIN public.academic_sections s ON s.id = e.section_id
    WHERE e.id = p_enrollment_id
      AND (
        s.teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.academic_section_assistants a
          WHERE a.section_id = s.id AND a.assistant_id = auth.uid()
        )
      )
  );
$$;

-- ========== 036_user_role_assistant_external_section_assistants.sql ==========

-- user_role: dedicated portal staff "assistant" (not necessarily a classroom teacher).
-- External assistants (no login): names stored per section.
-- Transfer requests: any lead/assistant on the section may open a request (not teacher-role-only).

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'assistant';

COMMENT ON TABLE public.academic_section_assistants IS
  'Additional profiles (teacher, student, or assistant role) with access to the section roster, attendance, and grades; not the lead teacher_id.';

CREATE TABLE IF NOT EXISTS public.academic_section_external_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT academic_section_external_assistants_display_nonempty
    CHECK (length(trim(display_name)) > 0)
);

CREATE INDEX IF NOT EXISTS academic_section_external_assistants_section_idx
  ON public.academic_section_external_assistants (section_id);

COMMENT ON TABLE public.academic_section_external_assistants IS
  'Volunteer or guest assistants without a profiles row; no portal access; schedule overlap is not enforced in the app.';

ALTER TABLE public.academic_section_external_assistants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_section_external_assistants_select_scope
  ON public.academic_section_external_assistants;
CREATE POLICY academic_section_external_assistants_select_scope
  ON public.academic_section_external_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_id AND s.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_section_assistants a
      WHERE a.section_id = section_id AND a.assistant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS academic_section_external_assistants_admin_insert
  ON public.academic_section_external_assistants;
CREATE POLICY academic_section_external_assistants_admin_insert
  ON public.academic_section_external_assistants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_section_external_assistants_admin_delete
  ON public.academic_section_external_assistants;
CREATE POLICY academic_section_external_assistants_admin_delete
  ON public.academic_section_external_assistants
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_section_external_assistants_admin_update
  ON public.academic_section_external_assistants;
CREATE POLICY academic_section_external_assistants_admin_update
  ON public.academic_section_external_assistants
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS section_transfer_requests_teacher_insert ON public.section_transfer_requests;
CREATE POLICY section_transfer_requests_teacher_insert ON public.section_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.user_leads_or_assists_section(auth.uid(), from_section_id)
  );

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
     AND v_role_raw IN ('admin', 'teacher', 'student', 'parent', 'assistant') THEN
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

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auth trigger: provision profile; admin_invite may set role including assistant (see 036).';

-- ========== 037_fix_academic_sections_rls_recursion_assistants.sql ==========

-- Break RLS recursion: academic_sections SELECT referenced academic_section_assistants,
-- whose SELECT policy queried academic_sections again (42P17 infinite recursion).

CREATE OR REPLACE FUNCTION public.user_is_section_lead_teacher(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    WHERE s.id = p_section_id
      AND s.teacher_id = p_uid
  );
$$;

COMMENT ON FUNCTION public.user_is_section_lead_teacher(uuid, uuid) IS
  'True if p_uid is the section lead (teacher_id). SECURITY DEFINER to avoid RLS recursion with academic_section_assistants policies.';

GRANT EXECUTE ON FUNCTION public.user_is_section_lead_teacher(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS academic_section_assistants_select_scope ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_select_scope ON public.academic_section_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR assistant_id = auth.uid()
    OR public.user_is_section_lead_teacher(auth.uid(), section_id)
  );

DROP POLICY IF EXISTS academic_section_external_assistants_select_scope
  ON public.academic_section_external_assistants;
CREATE POLICY academic_section_external_assistants_select_scope
  ON public.academic_section_external_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_is_section_lead_teacher(auth.uid(), section_id)
    OR EXISTS (
      SELECT 1 FROM public.academic_section_assistants a
      WHERE a.section_id = section_id AND a.assistant_id = auth.uid()
    )
  );

-- ========== 038_section_attendance_teacher_delete.sql ==========

-- Allow teachers to delete attendance rows they recorded within the same operational window as insert/update,
-- so the client can offer a safe "undo" after a column bulk-fill of empty cells.

DROP POLICY IF EXISTS section_attendance_teacher_delete ON public.section_attendance;
CREATE POLICY section_attendance_teacher_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

-- ========== 039_portal_calendar_feed_and_section_room.sql ==========

-- Portal calendar: persistent iCal subscription token on profiles; optional room label on sections (admin master calendar filter).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calendar_feed_token UUID NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_calendar_feed_token_uidx
  ON public.profiles (calendar_feed_token)
  WHERE calendar_feed_token IS NOT NULL;

COMMENT ON COLUMN public.profiles.calendar_feed_token IS
  'Opaque token for GET /api/calendar/feed/[token].ics (subscription). Rotatable; never treat as secret beyond unlisted URL.';

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS room_label TEXT NULL;

COMMENT ON COLUMN public.academic_sections.room_label IS
  'Optional classroom / room name for admin scheduling views and calendar filters.';

-- ========== 040_portal_special_calendar_events.sql ==========

-- Institute-wide special calendar events (holidays, assemblies) visible to all authenticated users; admin CRUD.

CREATE TABLE IF NOT EXISTS public.portal_special_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_special_calendar_events_time_chk CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS portal_special_calendar_events_starts_idx
  ON public.portal_special_calendar_events (starts_at ASC);

COMMENT ON TABLE public.portal_special_calendar_events IS
  'School-wide calendar rows (special / non-class) shown in portal calendars and iCal feeds.';

DROP TRIGGER IF EXISTS portal_special_calendar_events_set_updated_at ON public.portal_special_calendar_events;
CREATE TRIGGER portal_special_calendar_events_set_updated_at
  BEFORE UPDATE ON public.portal_special_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.portal_special_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_special_calendar_events_select_auth ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_select_auth
  ON public.portal_special_calendar_events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS portal_special_calendar_events_insert_admin ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_insert_admin
  ON public.portal_special_calendar_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_special_calendar_events_update_admin ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_update_admin
  ON public.portal_special_calendar_events FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_special_calendar_events_delete_admin ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_delete_admin
  ON public.portal_special_calendar_events FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== 041_class_reminder_jobs.sql ==========

-- Class reminder queue, per-student channel prefs, in-app items; site_settings seeds.
-- Jobs are written/read by service_role (cron); authenticated users have no direct job access.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_reminder_job_kind') THEN
    CREATE TYPE public.class_reminder_job_kind AS ENUM (
      'prep_email',
      'urgent_in_app',
      'urgent_whatsapp'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_reminder_job_status') THEN
    CREATE TYPE public.class_reminder_job_status AS ENUM (
      'pending',
      'processing',
      'sent',
      'failed',
      'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.class_reminder_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  section_enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  occurrence_start_at TIMESTAMPTZ NOT NULL,
  kind public.class_reminder_job_kind NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  status public.class_reminder_job_status NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code TEXT,
  channels_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_reminder_jobs_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS class_reminder_jobs_dispatch_idx
  ON public.class_reminder_jobs (status, send_at ASC)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS class_reminder_jobs_enrollment_idx
  ON public.class_reminder_jobs (section_enrollment_id);

CREATE INDEX IF NOT EXISTS class_reminder_jobs_section_idx
  ON public.class_reminder_jobs (section_id);

DROP TRIGGER IF EXISTS class_reminder_jobs_set_updated_at ON public.class_reminder_jobs;
CREATE TRIGGER class_reminder_jobs_set_updated_at
  BEFORE UPDATE ON public.class_reminder_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.class_reminder_jobs ENABLE ROW LEVEL SECURITY;

-- Per enrolled student: who receives email / in-app / WhatsApp for that student's class reminders.
CREATE TABLE IF NOT EXISTS public.class_reminder_channel_prefs (
  student_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  email_class_prep BOOLEAN NOT NULL DEFAULT true,
  in_app_class_urgent BOOLEAN NOT NULL DEFAULT true,
  whatsapp_class_urgent BOOLEAN NOT NULL DEFAULT false,
  whatsapp_opt_in_at TIMESTAMPTZ,
  whatsapp_phone_e164 TEXT,
  whatsapp_last_error_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS class_reminder_channel_prefs_set_updated_at ON public.class_reminder_channel_prefs;
CREATE TRIGGER class_reminder_channel_prefs_set_updated_at
  BEFORE UPDATE ON public.class_reminder_channel_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.class_reminder_channel_prefs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.class_reminder_prefs_is_tutor_of_student(p_student uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutor_student_rel t
    WHERE t.tutor_id = auth.uid()
      AND t.student_id = p_student
  );
$$;

COMMENT ON FUNCTION public.class_reminder_prefs_is_tutor_of_student IS
  'True when the current user is a linked tutor for the student (RLS helper).';

DROP POLICY IF EXISTS class_reminder_channel_prefs_select ON public.class_reminder_channel_prefs;
CREATE POLICY class_reminder_channel_prefs_select ON public.class_reminder_channel_prefs
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.class_reminder_prefs_is_tutor_of_student(student_id)
  );

DROP POLICY IF EXISTS class_reminder_channel_prefs_insert ON public.class_reminder_channel_prefs;
CREATE POLICY class_reminder_channel_prefs_insert ON public.class_reminder_channel_prefs
  FOR INSERT TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND NOT COALESCE((SELECT p.is_minor FROM public.profiles p WHERE p.id = student_id), false))
    OR public.class_reminder_prefs_is_tutor_of_student(student_id)
  );

DROP POLICY IF EXISTS class_reminder_channel_prefs_update ON public.class_reminder_channel_prefs;
CREATE POLICY class_reminder_channel_prefs_update ON public.class_reminder_channel_prefs
  FOR UPDATE TO authenticated
  USING (
    (student_id = auth.uid() AND NOT COALESCE((SELECT p.is_minor FROM public.profiles p WHERE p.id = student_id), false))
    OR public.class_reminder_prefs_is_tutor_of_student(student_id)
  )
  WITH CHECK (
    (student_id = auth.uid() AND NOT COALESCE((SELECT p.is_minor FROM public.profiles p WHERE p.id = student_id), false))
    OR public.class_reminder_prefs_is_tutor_of_student(student_id)
  );

CREATE TABLE IF NOT EXISTS public.class_reminder_in_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.class_reminder_jobs (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_reminder_in_app_job_unique UNIQUE (job_id)
);

CREATE INDEX IF NOT EXISTS class_reminder_in_app_recipient_idx
  ON public.class_reminder_in_app (recipient_user_id, created_at DESC);

ALTER TABLE public.class_reminder_in_app ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_reminder_in_app_select ON public.class_reminder_in_app;
CREATE POLICY class_reminder_in_app_select ON public.class_reminder_in_app
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS class_reminder_in_app_update ON public.class_reminder_in_app;
CREATE POLICY class_reminder_in_app_update ON public.class_reminder_in_app
  FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

INSERT INTO public.site_settings (key, value)
VALUES
  ('class_reminders_enabled', 'false'::jsonb),
  ('class_reminder_prep_offset_minutes', '1440'::jsonb),
  ('class_reminder_urgent_offset_minutes', '30'::jsonb),
  ('class_reminder_institute_tz', '"America/Argentina/Cordoba"'::jsonb),
  (
    'class_reminder_whatsapp_quiet',
    '{"startHour":22,"startMinute":0,"endHour":8,"endMinute":1}'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

-- ========== 042_drop_legacy_section_grades.sql ==========

-- Remove deprecated quick grades table superseded by cohort assessments.

DROP POLICY IF EXISTS section_grades_select_scope ON public.section_grades;
DROP POLICY IF EXISTS section_grades_teacher_insert ON public.section_grades;
DROP POLICY IF EXISTS section_grades_teacher_update ON public.section_grades;
DROP POLICY IF EXISTS section_grades_admin_delete ON public.section_grades;

DROP INDEX IF EXISTS public.section_grades_enrollment_idx;

DROP TABLE IF EXISTS public.section_grades;

-- ========== 043_portal_special_calendar_event_types_scope_rls.sql ==========

-- Portal special calendar: closed event types, visibility scope, meeting URL, scoped SELECT RLS.

ALTER TABLE public.portal_special_calendar_events
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'social',
  ADD COLUMN IF NOT EXISTS calendar_scope TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS cohort_id UUID NULL REFERENCES public.academic_cohorts (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS section_id UUID NULL REFERENCES public.academic_sections (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS meeting_url TEXT NULL;

ALTER TABLE public.portal_special_calendar_events
  DROP CONSTRAINT IF EXISTS portal_special_calendar_events_event_type_chk;

ALTER TABLE public.portal_special_calendar_events
  ADD CONSTRAINT portal_special_calendar_events_event_type_chk CHECK (
    event_type IN (
      'holiday',
      'institutional_exam',
      'parent_meeting',
      'social',
      'trimester_admin'
    )
  );

ALTER TABLE public.portal_special_calendar_events
  DROP CONSTRAINT IF EXISTS portal_special_calendar_events_scope_chk;

ALTER TABLE public.portal_special_calendar_events
  ADD CONSTRAINT portal_special_calendar_events_scope_chk CHECK (
    (calendar_scope = 'global' AND cohort_id IS NULL AND section_id IS NULL)
    OR (calendar_scope = 'cohort' AND cohort_id IS NOT NULL AND section_id IS NULL)
    OR (calendar_scope = 'section' AND section_id IS NOT NULL AND cohort_id IS NULL)
  );

COMMENT ON COLUMN public.portal_special_calendar_events.event_type IS
  'Closed catalog: holiday, institutional_exam, parent_meeting, social, trimester_admin.';

COMMENT ON COLUMN public.portal_special_calendar_events.calendar_scope IS
  'Visibility scope: global (institute), cohort (single cohort), or section (single section).';

CREATE INDEX IF NOT EXISTS portal_special_calendar_events_cohort_idx
  ON public.portal_special_calendar_events (cohort_id)
  WHERE cohort_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_special_calendar_events_section_idx
  ON public.portal_special_calendar_events (section_id)
  WHERE section_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.portal_special_calendar_row_visible(
  p_viewer uuid,
  p_event_type text,
  p_calendar_scope text,
  p_cohort_id uuid,
  p_section_id uuid
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF public.is_admin(p_viewer) THEN
    RETURN true;
  END IF;

  SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = p_viewer;
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  IF p_event_type = 'parent_meeting' THEN
    IF v_role = 'student' THEN
      RETURN false;
    END IF;

    IF v_role = 'parent' THEN
      IF p_calendar_scope = 'global' THEN
        RETURN true;
      ELSIF p_calendar_scope = 'cohort' AND p_cohort_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1
          FROM public.tutor_student_rel tsr
          JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
          JOIN public.academic_sections s ON s.id = se.section_id AND s.archived_at IS NULL
          WHERE tsr.tutor_id = p_viewer AND s.cohort_id = p_cohort_id
        );
      ELSIF p_calendar_scope = 'section' AND p_section_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1
          FROM public.tutor_student_rel tsr
          JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
          WHERE tsr.tutor_id = p_viewer AND se.section_id = p_section_id
        );
      END IF;
      RETURN false;
    END IF;

    IF v_role IN ('teacher', 'assistant') THEN
      IF p_calendar_scope <> 'section' OR p_section_id IS NULL THEN
        RETURN false;
      END IF;
      RETURN EXISTS (
        SELECT 1
        FROM public.academic_sections s
        WHERE s.id = p_section_id
          AND s.archived_at IS NULL
          AND (
            s.teacher_id = p_viewer
            OR EXISTS (
              SELECT 1 FROM public.academic_section_assistants a
              WHERE a.section_id = s.id AND a.assistant_id = p_viewer
            )
          )
      );
    END IF;

    RETURN false;
  END IF;

  IF p_calendar_scope = 'global' THEN
    RETURN true;
  END IF;

  IF p_calendar_scope = 'cohort' AND p_cohort_id IS NOT NULL THEN
    IF v_role = 'student' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.section_enrollments se
        JOIN public.academic_sections s ON s.id = se.section_id AND s.archived_at IS NULL
        WHERE se.student_id = p_viewer AND se.status = 'active' AND s.cohort_id = p_cohort_id
      );
    END IF;

    IF v_role = 'parent' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.tutor_student_rel tsr
        JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
        JOIN public.academic_sections s ON s.id = se.section_id AND s.archived_at IS NULL
        WHERE tsr.tutor_id = p_viewer AND s.cohort_id = p_cohort_id
      );
    END IF;

    IF v_role IN ('teacher', 'assistant') THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.academic_sections s
        WHERE s.cohort_id = p_cohort_id
          AND s.archived_at IS NULL
          AND (
            s.teacher_id = p_viewer
            OR EXISTS (
              SELECT 1 FROM public.academic_section_assistants a
              WHERE a.section_id = s.id AND a.assistant_id = p_viewer
            )
          )
      );
    END IF;

    RETURN false;
  END IF;

  IF p_calendar_scope = 'section' AND p_section_id IS NOT NULL THEN
    IF v_role = 'student' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.section_enrollments se
        WHERE se.student_id = p_viewer AND se.status = 'active' AND se.section_id = p_section_id
      );
    END IF;

    IF v_role = 'parent' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.tutor_student_rel tsr
        JOIN public.section_enrollments se ON se.student_id = tsr.student_id AND se.status = 'active'
        WHERE tsr.tutor_id = p_viewer AND se.section_id = p_section_id
      );
    END IF;

    IF v_role IN ('teacher', 'assistant') THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.academic_sections s
        WHERE s.id = p_section_id
          AND s.archived_at IS NULL
          AND (
            s.teacher_id = p_viewer
            OR EXISTS (
              SELECT 1 FROM public.academic_section_assistants a
              WHERE a.section_id = s.id AND a.assistant_id = p_viewer
            )
          )
      );
    END IF;

    RETURN false;
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS portal_special_calendar_events_select_auth ON public.portal_special_calendar_events;
CREATE POLICY portal_special_calendar_events_select_scoped
  ON public.portal_special_calendar_events
  FOR SELECT TO authenticated
  USING (
    public.portal_special_calendar_row_visible(
      auth.uid(),
      event_type,
      calendar_scope,
      cohort_id,
      section_id
    )
  );

COMMENT ON FUNCTION public.portal_special_calendar_row_visible(uuid, text, text, uuid, uuid) IS
  'RLS helper: visibility by role, event_type, and calendar_scope (mirrors app-side filter for feed).';

-- ========== 044_section_attendance_rls_portal_staff.sql ==========

-- Attendance writes were gated on user_has_role(..., 'teacher') while the app allows
-- lead teachers, staff assistants, and student assistants (section_enrollment_teacher_is_self).
-- Drop the role check; enrollment+section membership already scopes writes.

DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
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
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_delete ON public.section_attendance;
CREATE POLICY section_attendance_teacher_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (CURRENT_DATE - INTERVAL '2 days')::date
      AND attended_on <= CURRENT_DATE
    )
  );

-- ========== 045_section_attendance_teacher_institute_window.sql ==========

-- Teacher/staff portal attendance: widen write window to the institute calendar (aligned with app
-- `getInstituteTimeZone` / analytics) instead of PostgreSQL CURRENT_DATE and “last 2 days”.
-- Upper bound: no marks after institute-local “today”. Lower: wide bounded lookback so RLS does not
-- contradict app rules that allow any attended_on from section start (see adminAttendanceMatrixEffMinIso).

DROP POLICY IF EXISTS section_attendance_teacher_write ON public.section_attendance;
CREATE POLICY section_attendance_teacher_write ON public.section_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_update ON public.section_attendance;
CREATE POLICY section_attendance_teacher_update ON public.section_attendance
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

DROP POLICY IF EXISTS section_attendance_teacher_delete ON public.section_attendance;
CREATE POLICY section_attendance_teacher_delete ON public.section_attendance
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      public.section_enrollment_teacher_is_self(enrollment_id)
      AND recorded_by = auth.uid()
      AND attended_on >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date - INTERVAL '4000 days'
      )::date
      AND attended_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
    )
  );

-- ========== 046_site_themes.sql ==========

-- Runtime theming + landing CMS
-- Modelo: cada `site_themes` row es un "template" (default, navidad, aniversario...).
-- Solo uno puede estar `is_active = true` a la vez (índice parcial UNIQUE).
-- `properties` JSONB sobreescribe claves de `system.properties` (color.*, layout.*, shadow.*, app.*, contact.*).
-- `content` JSONB guarda overrides de copy de landing por sección (ES + EN).
-- `site_theme_media` guarda imágenes por sección + posición; storage en bucket `landing-media`.
-- Lectura del tema activo: pública (anon + authenticated). Escritura: admin.

-- site_themes ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT site_themes_archived_not_active
    CHECK (archived_at IS NULL OR is_active = FALSE)
);

COMMENT ON TABLE public.site_themes IS
  'Runtime theming / landing CMS templates. Up to one row may have is_active = true.';

COMMENT ON COLUMN public.site_themes.properties IS
  'JSONB map of system.properties overrides (e.g. {"color.primary":"#000"}). Defaults from system.properties.';

COMMENT ON COLUMN public.site_themes.content IS
  'JSONB map of landing copy overrides by section + locale. Defaults from src/dictionaries/*.json.';

CREATE UNIQUE INDEX IF NOT EXISTS site_themes_only_one_active
  ON public.site_themes (is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS site_themes_admin_list_idx
  ON public.site_themes (archived_at NULLS FIRST, is_active DESC, created_at DESC);

-- updated_at trigger --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.site_themes_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_themes_set_updated_at ON public.site_themes;
CREATE TRIGGER site_themes_set_updated_at
  BEFORE UPDATE ON public.site_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.site_themes_set_updated_at();

-- site_theme_media ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_theme_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES public.site_themes (id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  position INT NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  alt_es TEXT NULL,
  alt_en TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (theme_id, section, position)
);

COMMENT ON TABLE public.site_theme_media IS
  'Images per landing section (inicio, historia, modalidades, niveles, certificaciones, oferta). Shared ES/EN in v1.';

CREATE INDEX IF NOT EXISTS site_theme_media_theme_section_idx
  ON public.site_theme_media (theme_id, section);

-- RLS -----------------------------------------------------------------------
ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_theme_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_themes_select_active ON public.site_themes;
CREATE POLICY site_themes_select_active
  ON public.site_themes FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS site_themes_select_admin ON public.site_themes;
CREATE POLICY site_themes_select_admin
  ON public.site_themes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_themes_all_admin ON public.site_themes;
CREATE POLICY site_themes_all_admin
  ON public.site_themes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_theme_media_select_active ON public.site_theme_media;
CREATE POLICY site_theme_media_select_active
  ON public.site_theme_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.site_themes t
      WHERE t.id = site_theme_media.theme_id AND t.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS site_theme_media_select_admin ON public.site_theme_media;
CREATE POLICY site_theme_media_select_admin
  ON public.site_theme_media FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_theme_media_all_admin ON public.site_theme_media;
CREATE POLICY site_theme_media_all_admin
  ON public.site_theme_media FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Storage bucket: landing-media (público RO, escritura admin) ---------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-media', 'landing-media', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS landing_media_select_public ON storage.objects;
CREATE POLICY landing_media_select_public
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'landing-media');

DROP POLICY IF EXISTS landing_media_insert_admin ON storage.objects;
CREATE POLICY landing_media_insert_admin
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'landing-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS landing_media_update_admin ON storage.objects;
CREATE POLICY landing_media_update_admin
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'landing-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS landing_media_delete_admin ON storage.objects;
CREATE POLICY landing_media_delete_admin
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'landing-media'
    AND public.is_admin(auth.uid())
  );

-- ========== 047_admin_traffic_visitor_breakdowns.sql ==========

-- Per visitor_kind breakdowns for the admin analytics traffic cards
-- (top pathnames + top user-agents). Bounded result sets for the UI tabs.

CREATE OR REPLACE FUNCTION public.admin_traffic_kind_path_breakdown(
  p_kind public.traffic_visitor_kind,
  p_days int,
  p_limit int DEFAULT 200
)
RETURNS TABLE (pathname text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 200), 1000);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    t.pathname,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.visitor_kind = p_kind
  GROUP BY t.pathname
  ORDER BY cnt DESC, pathname
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_kind_path_breakdown(public.traffic_visitor_kind, int, int)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_traffic_kind_agent_breakdown(
  p_kind public.traffic_visitor_kind,
  p_days int,
  p_limit int DEFAULT 100
)
RETURNS TABLE (user_agent text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 100), 500);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    coalesce(nullif(btrim(t.user_agent), ''), '(unknown)') AS user_agent,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.visitor_kind = p_kind
  GROUP BY 1
  ORDER BY cnt DESC, user_agent
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_kind_agent_breakdown(public.traffic_visitor_kind, int, int)
  TO authenticated;

CREATE INDEX IF NOT EXISTS traffic_page_hits_kind_path_created_idx
  ON public.traffic_page_hits (visitor_kind, pathname, created_at DESC);

CREATE INDEX IF NOT EXISTS traffic_page_hits_kind_ua_created_idx
  ON public.traffic_page_hits (visitor_kind, user_agent, created_at DESC);

-- ========== 048_site_themes_blocks_and_kind.sql ==========

-- PR 6: subsecciones dinámicas + template_kind para los templates de landing.
-- Ver docs/adr/2026-04-cms-blocks-and-template-kind.md.
--
-- 1. Enum `site_theme_kind`: dos personalidades visuales en v1
--    ('classic' = lo de hoy; 'editorial' = layout alternativo full-bleed).
-- 2. Columna `site_themes.template_kind` con default 'classic' para no romper
--    nada al desplegar (todas las filas existentes siguen pintando igual).
-- 3. Columna `site_themes.blocks` JSONB para subsecciones dinámicas asociadas
--    a las 6 secciones canónicas. La validación de forma/tamaño se hace en
--    las server actions (`sanitizeLandingBlocksForPersistence`); aquí solo
--    garantizamos un default seguro.
--
-- No se cambian RLS ni políticas: blocks/template_kind viven dentro de la
-- propia fila, así que las policies de SELECT/ALL ya cubren ambas columnas.

-- 1) Enum -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'site_theme_kind'
  ) THEN
    CREATE TYPE public.site_theme_kind AS ENUM ('classic', 'editorial');
  END IF;
END;
$$;

COMMENT ON TYPE public.site_theme_kind IS
  'Personalidad visual de un template de landing. classic = layout actual; editorial = shell alternativo full-bleed con tipografía display.';

-- 2) Columnas en site_themes -----------------------------------------------
ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS template_kind public.site_theme_kind
    NOT NULL DEFAULT 'classic';

ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS blocks JSONB
    NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.site_themes.template_kind IS
  'Selecciona el shell de la landing pública (LandingMainSections clásico vs editorial). Defaults a classic para retrocompatibilidad.';

COMMENT ON COLUMN public.site_themes.blocks IS
  'Array de subsecciones dinámicas (cards/callouts/quotes) asociadas a las secciones canónicas. Validado por server actions (sanitizeLandingBlocksForPersistence). Cap suave de 24 bloques por template.';

-- 3) Backfill defensivo (no debería hacer falta por DEFAULT, pero idempotente) -
UPDATE public.site_themes
SET template_kind = 'classic'
WHERE template_kind IS NULL;

UPDATE public.site_themes
SET blocks = '[]'::jsonb
WHERE blocks IS NULL;

-- ========== 049_site_themes_seed_editorial.sql ==========

-- Seed: 'Editorial' site_theme template
-- Provides a second template with template_kind = 'editorial' so admins can
-- duplicate / activate it from the CMS without manual SQL. Idempotent: only
-- inserts when no row with this slug exists.

INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks
)
SELECT
  'editorial',
  'Editorial',
  FALSE,
  'editorial'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#1F2937',
    'color.secondary', '#B45309',
    'color.background', '#FAFAF9',
    'color.surface', '#FFFFFF',
    'color.muted', '#E7E5E4',
    'color.foreground', '#111827',
    'layout.border-radius', '4px'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes WHERE slug = 'editorial'
);

COMMENT ON COLUMN public.site_themes.template_kind IS
  'Selecciona el shell de la landing pública (LandingMainSections clásico vs editorial). Defaults a classic para retrocompatibilidad.';

-- ========== 050_site_themes_kind_minimal.sql ==========

-- Extend site_theme_kind enum with 'minimal' so admins can switch the public
-- landing to a third visual personality without manual SQL.
--
-- IMPORTANTE: Postgres no permite usar un nuevo valor de enum en la misma
-- transacción donde se añade ("New enum values must be committed before they
-- can be used", SQLSTATE 55P04). Supabase corre cada migración dentro de una
-- transacción, así que esta migración SOLO añade el valor al enum. El INSERT
-- semilla del template 'Minimal' vive en `051_site_themes_seed_minimal.sql`,
-- que ya puede referenciar 'minimal'::public.site_theme_kind con seguridad.
--
-- Idempotente: salta el ALTER cuando el valor ya existe.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'site_theme_kind' AND e.enumlabel = 'minimal'
  ) THEN
    ALTER TYPE public.site_theme_kind ADD VALUE 'minimal';
  END IF;
END;
$$;

-- ========== 051_site_themes_seed_minimal.sql ==========

-- Seed: 'Minimal' site_theme template
-- Provides a third template with template_kind = 'minimal' so admins can
-- duplicate / activate it from the CMS without manual SQL. Idempotent: only
-- inserts when no row with this slug exists.
--
-- Va en una migración separada de la que añade el valor al enum (050) porque
-- Postgres exige que los nuevos valores de enum estén "committed" antes de
-- poder usarse en consultas (SQLSTATE 55P04). Como cada migración corre en su
-- propia transacción, separar el ALTER del INSERT garantiza que 'minimal' ya
-- existe y está disponible en el catálogo cuando llegamos al cast aquí abajo.

INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks
)
SELECT
  'minimal',
  'Minimal',
  FALSE,
  'minimal'::public.site_theme_kind,
  jsonb_build_object(
    'color.primary', '#0F172A',
    'color.secondary', '#0EA5E9',
    'color.background', '#FFFFFF',
    'color.surface', '#F8FAFC',
    'color.muted', '#E2E8F0',
    'color.foreground', '#0F172A',
    'layout.border-radius', '12px'
  ),
  '{}'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_themes WHERE slug = 'minimal'
);

-- ========== 052_site_themes_system_default.sql ==========

-- PR 8: convertir el "Tema por defecto" en una fila real de site_themes,
-- editable desde el CMS igual que cualquier otro template.
--
-- Antes: el grid de admin renderizaba un card "virtual" leyendo solo
-- `system.properties`, pero los textos / properties / blocks de ese tema no se
-- podían modificar desde la UI (no había row donde guardar overrides).
-- Después: existe siempre un row con slug='default' marcado
-- `is_system_default = true`, que arranca con `properties = {}` y `content = {}`
-- (=> hereda `system.properties` y los diccionarios), y cualquier admin puede
-- editar tokens, copy de landing, hero o blocks como con los demás templates.
-- Las server actions bloquean archivar/borrar el system default para garantizar
-- que siempre haya un fallback consistente.
--
-- Idempotente:
-- - ADD COLUMN ... IF NOT EXISTS
-- - índice parcial UNIQUE para que como mucho exista UN system default
-- - INSERT ... ON CONFLICT (slug) actualiza el flag si alguien ya tenía un
--   row con slug='default' creado a mano
-- - si no hay ningún row activo todavía, activa el system default

-- 1) Columna -----------------------------------------------------------------
ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS is_system_default BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.site_themes.is_system_default IS
  'Marca el row "Tema por defecto" del sistema. Solo uno puede tener TRUE. Las server actions impiden archivarlo o borrarlo para garantizar fallback consistente.';

-- 2) A lo más un system default -------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS site_themes_only_one_system_default
  ON public.site_themes (is_system_default)
  WHERE is_system_default = TRUE;

-- 3) Seed idempotente del row default ---------------------------------------
-- Si alguien ya creó manualmente un row con slug='default' (poco probable,
-- pero posible), lo promovemos a system default sin pisar properties/content.
INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks,
  is_system_default
)
VALUES (
  'default',
  'Tema por defecto',
  FALSE,
  'classic'::public.site_theme_kind,
  '{}'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE
  SET is_system_default = TRUE;

-- 4) Garantizar que siempre haya un activo ----------------------------------
-- Si no había ningún row con `is_active = true` antes de esta migración, el
-- system default toma el rol del tema activo (el sitio público sigue pintando
-- exactamente igual porque properties/content están vacíos).
UPDATE public.site_themes
SET is_active = TRUE
WHERE is_system_default = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.site_themes WHERE is_active = TRUE
  );

-- ========== 053_email_templates.sql ==========

-- Communications: editable email templates per locale.
--
-- Modelo:
--   - El catálogo de `template_key`s vive en código (registry TS), no en BD.
--   - `email_templates` guarda OVERRIDES del admin por (template_key, locale).
--     Si no existe fila, los emisores caen al default del registry y todo el
--     producto sigue funcionando exactamente igual que antes de esta migración.
--   - Layout/branding se aplica en `wrapEmailHtml.ts` (server-only) y NO se
--     persiste aquí: `body_html` es solo el cuerpo (lo que cambia entre emails).
--
-- RLS:
--   - SELECT/INSERT/UPDATE/DELETE: admin via `public.is_admin(auth.uid())`.
--   - El backend (envío real de emails) lee con service-role / admin client,
--     que hace bypass RLS, igual que el resto de adapters de `src/lib/email/`.

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  locale TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT email_templates_locale_supported
    CHECK (locale IN ('es', 'en')),
  CONSTRAINT email_templates_subject_nonempty
    CHECK (length(btrim(subject)) > 0),
  CONSTRAINT email_templates_body_nonempty
    CHECK (length(btrim(body_html)) > 0)
);

COMMENT ON TABLE public.email_templates IS
  'Overrides editables del catálogo de plantillas de email (registry en código). Si no hay fila para (template_key, locale), el envío usa el default del registry.';

COMMENT ON COLUMN public.email_templates.template_key IS
  'Identificador estable de la plantilla (p. ej. "messaging.teacher_new"). El catálogo vive en src/lib/email/templates/templateRegistry.ts.';

COMMENT ON COLUMN public.email_templates.body_html IS
  'Solo el cuerpo HTML (sin layout). El wrapper unificado con header/logo/footer se aplica en wrapEmailHtml.ts.';

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_key_locale_uidx
  ON public.email_templates (template_key, locale);

-- updated_at trigger -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_templates_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_templates_set_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_set_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.email_templates_set_updated_at();

-- RLS ----------------------------------------------------------------------
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_templates_select_admin ON public.email_templates;
CREATE POLICY email_templates_select_admin
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS email_templates_modify_admin ON public.email_templates;
CREATE POLICY email_templates_modify_admin
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ========== 054_section_fee_plans.sql ==========

-- Section fee plans: monthly fee, payments per period, enrollment fee flag.
--
-- Una sección académica puede tener uno o más planes de cuotas con vigencias
-- (effective_from_year, effective_from_month). El plan vigente para un par
-- (year, month) es el de mayor (effective_from_year, effective_from_month) <=
-- (year, month). Esto permite cambiar el monto durante el año sin perder el
-- monto histórico ya facturado a los alumnos.
--
-- charges_enrollment_fee es metadata que indica si la sección cobra matrícula.
-- La matrícula se sigue gestionando por billing_invoices: este flag solo
-- declara explícitamente la propiedad de la sección y queda disponible para
-- automatizaciones futuras.

CREATE TABLE IF NOT EXISTS public.section_fee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  effective_from_year SMALLINT NOT NULL,
  effective_from_month SMALLINT NOT NULL,
  monthly_fee NUMERIC(12, 2) NOT NULL,
  payments_count SMALLINT NOT NULL,
  charges_enrollment_fee BOOLEAN NOT NULL DEFAULT false,
  period_start_year SMALLINT NOT NULL,
  period_start_month SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT section_fee_plans_month_range
    CHECK (effective_from_month BETWEEN 1 AND 12),
  CONSTRAINT section_fee_plans_year_range
    CHECK (effective_from_year BETWEEN 2000 AND 2100),
  CONSTRAINT section_fee_plans_period_month_range
    CHECK (period_start_month BETWEEN 1 AND 12),
  CONSTRAINT section_fee_plans_period_year_range
    CHECK (period_start_year BETWEEN 2000 AND 2100),
  CONSTRAINT section_fee_plans_fee_positive
    CHECK (monthly_fee >= 0),
  CONSTRAINT section_fee_plans_payments_count_range
    CHECK (payments_count BETWEEN 1 AND 24)
);

COMMENT ON TABLE public.section_fee_plans IS
  'Planes de cuotas por sección con vigencias. El plan activo para (year, month) es el más reciente con (effective_from_year, effective_from_month) <= (year, month).';

COMMENT ON COLUMN public.section_fee_plans.monthly_fee IS
  'Monto de la cuota mensual en la moneda del instituto. El descuento por beca se aplica en la app.';

COMMENT ON COLUMN public.section_fee_plans.payments_count IS
  'Cantidad de cuotas mensuales del período cubierto por este plan (1..24).';

COMMENT ON COLUMN public.section_fee_plans.charges_enrollment_fee IS
  'Si esta sección cobra matrícula. La matrícula sigue gestionándose por billing_invoices.';

COMMENT ON COLUMN public.section_fee_plans.period_start_month IS
  'Mes (1..12) del primer pago del período cubierto por este plan.';

CREATE UNIQUE INDEX IF NOT EXISTS section_fee_plans_section_effective_uidx
  ON public.section_fee_plans (section_id, effective_from_year, effective_from_month);

CREATE INDEX IF NOT EXISTS section_fee_plans_section_idx
  ON public.section_fee_plans (section_id);

-- updated_at trigger -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.section_fee_plans_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS section_fee_plans_set_updated_at ON public.section_fee_plans;
CREATE TRIGGER section_fee_plans_set_updated_at
  BEFORE UPDATE ON public.section_fee_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.section_fee_plans_set_updated_at();

-- RLS ----------------------------------------------------------------------
ALTER TABLE public.section_fee_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_fee_plans_select_scope ON public.section_fee_plans;
CREATE POLICY section_fee_plans_select_scope
  ON public.section_fee_plans FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_fee_plans.section_id
        AND s.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = section_fee_plans.section_id
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

DROP POLICY IF EXISTS section_fee_plans_admin_write ON public.section_fee_plans;
CREATE POLICY section_fee_plans_admin_write
  ON public.section_fee_plans FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Section-aware payments ----------------------------------------------------
-- A student can be enrolled in more than one section at a time and each section
-- can have its own monthly fee. Payments must therefore be tracked per section
-- so the same calendar month can have a separate receipt for each section the
-- student is enrolled in.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS section_id UUID
    REFERENCES public.academic_sections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_section_idx ON public.payments (section_id);

-- Replace the legacy single-section unique with a section-aware version.
-- We keep both partial unique indexes:
--   * one for rows that target a section (the new model);
--   * one for legacy rows without section_id (preserve historical receipts).
DO $$
BEGIN
  ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_student_period_uidx;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DROP INDEX IF EXISTS public.payments_student_period_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_section_period_uidx
  ON public.payments (student_id, section_id, month, year)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_legacy_period_uidx
  ON public.payments (student_id, month, year)
  WHERE section_id IS NULL;

-- Allow a student to create their own pending payment row (with receipt) for a
-- section they are actively enrolled in. Existing admin/parent insert policies
-- in 002_platform_phase remain untouched.
DROP POLICY IF EXISTS payments_insert_student_self ON public.payments;
CREATE POLICY payments_insert_student_self
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
    AND section_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.section_enrollments se
      WHERE se.student_id = auth.uid()
        AND se.section_id = payments.section_id
        AND se.status = 'active'
    )
  );

-- Allow the same student to update only their own pending row (e.g. attach a
-- receipt). Admin update policy from 002 still wins for staff.
DROP POLICY IF EXISTS payments_update_student_self ON public.payments;
CREATE POLICY payments_update_student_self
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );

-- ========== 055_section_fee_plans_archive.sql ==========

-- Section fee plans: lifecycle (archive / restore / hard delete).
--
-- Add a soft-delete column so admins can take a plan out of circulation
-- without losing the historical reference (e.g. for sections where students
-- already paid using that plan). Hard delete remains available for plans
-- that were never used; the application enforces that distinction.

ALTER TABLE public.section_fee_plans
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS archived_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.section_fee_plans.archived_at IS
  'Soft-delete marker. When NOT NULL, the plan is archived: it does not appear in student / teacher views and is not selectable as the effective plan for new payments, but it is preserved for historical traceability.';

COMMENT ON COLUMN public.section_fee_plans.archived_by IS
  'Admin user that archived the plan (for audit trail).';

CREATE INDEX IF NOT EXISTS section_fee_plans_section_active_idx
  ON public.section_fee_plans (section_id)
  WHERE archived_at IS NULL;

-- ========== 055_tutor_financial_access.sql ==========

-- Tutor financial access (default-allow opt-out) + shared payments view + tutor uploads in student folder.
--
-- Background
-- ----------
-- Historia: el tutor (perfil parent) y el alumno deben ver exactamente la misma
-- "tira de pagos" mensual y el tutor debe poder subir comprobantes en nombre
-- del alumno. Trazabilidad: payments.parent_id ya queda con el UUID del tutor
-- cuando él sube el comprobante (set explícito desde la server action). Esto
-- añade la capa de **privacidad** y los **permisos de Storage** que faltaban.
--
-- Decisiones (ver docs/adr/2026-04-tutor-shared-payments-view.md)
-- ---------------------------------------------------------------
-- 1. Default-allow + opt-out: por defecto el tutor enlazado en
--    tutor_student_rel ve la situación financiera del alumno. El alumno
--    **mayor de edad** puede revocarlo desde su perfil. Modelado con
--    tutor_student_rel.financial_access_revoked_at TIMESTAMPTZ NULL
--    (NULL = activo). RLS adicional: solo el alumno mayor puede setearla /
--    limpiarla; admins pueden seguir gestionando vínculos por completo.
-- 2. Storage = carpeta del alumno: todos los receipts viven bajo
--    payment-receipts/{studentId}/..., aunque los suba el tutor. Mantenemos
--    la policy original (carpeta = uploader) para no romper receipts antiguos
--    subidos por tutores antes de esta migración.
-- 3. Trazabilidad: queda en payments.parent_id (set desde la server action
--    submitTutorPaymentReceipt) + evento user_events
--    'payment_receipt_submitted_tutor'.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- DROP POLICY IF EXISTS / CREATE POLICY.

-- 1) Privacidad ----------------------------------------------------------
ALTER TABLE public.tutor_student_rel
  ADD COLUMN IF NOT EXISTS financial_access_revoked_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS financial_access_revoked_by UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tutor_student_rel.financial_access_revoked_at IS
  'NULL = el tutor ve la tira de pagos del alumno y puede subir comprobantes. NON-NULL = el alumno mayor revocó ese acceso (default-allow + opt-out).';

COMMENT ON COLUMN public.tutor_student_rel.financial_access_revoked_by IS
  'Alumno (o admin) que revocó el acceso financiero del tutor. Información de auditoría.';

-- 2) Helper SECURITY DEFINER ---------------------------------------------
-- Resolver acceso financiero sin tener que reescribir EXISTS en cada policy.
CREATE OR REPLACE FUNCTION public.tutor_can_view_student_finance(
  p_tutor_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutor_student_rel ts
    WHERE ts.tutor_id = p_tutor_id
      AND ts.student_id = p_student_id
      AND ts.financial_access_revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.tutor_can_view_student_finance(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tutor_can_view_student_finance(UUID, UUID) TO authenticated;

-- 3) RLS payments: select / insert / update con vínculo activo ------------
-- SELECT: admin, alumno, parent_id legacy, teacher (legado de 002), o tutor
-- enlazado con acceso financiero activo.
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
    OR public.tutor_can_view_student_finance(auth.uid(), payments.student_id)
  );

-- INSERT del tutor: además de tener el vínculo, debe tener acceso financiero.
DROP POLICY IF EXISTS payments_insert_parent ON public.payments;
CREATE POLICY payments_insert_parent
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND public.tutor_can_view_student_finance(auth.uid(), payments.student_id)
  );

-- UPDATE del tutor: pendiente, vínculo activo, parent_id queda ya seteado
-- por la app (alineado con submitTutorPaymentReceipt).
DROP POLICY IF EXISTS payments_update_parent ON public.payments;
CREATE POLICY payments_update_parent
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND public.tutor_can_view_student_finance(auth.uid(), payments.student_id)
    AND (parent_id IS NULL OR parent_id = auth.uid())
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND status = 'pending'
  );

-- 4) RLS Storage: tutor escribe / lee receipts en carpeta del alumno -----
-- Mantenemos las policies existentes (carpeta = uploader) por compatibilidad
-- con receipts que siguen el path antiguo {tutorId}/...; añadimos las
-- variantes "carpeta del alumno enlazado".
DROP POLICY IF EXISTS payment_receipts_insert_tutor_for_student
  ON storage.objects;
CREATE POLICY payment_receipts_insert_tutor_for_student
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND public.tutor_can_view_student_finance(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

DROP POLICY IF EXISTS payment_receipts_select_tutor_for_student
  ON storage.objects;
CREATE POLICY payment_receipts_select_tutor_for_student
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.tutor_can_view_student_finance(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

DROP POLICY IF EXISTS payment_receipts_update_tutor_for_student
  ON storage.objects;
CREATE POLICY payment_receipts_update_tutor_for_student
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.tutor_can_view_student_finance(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

-- 5) RLS tutor_student_rel: alumno mayor toggle de acceso financiero -----
-- Conservamos la policy admin existente y añadimos la del alumno mayor:
-- solo el dueño (auth.uid() = student_id) y solo si NO es minor puede
-- alterar las columnas financial_access_revoked_at / financial_access_revoked_by.
-- La RLS de UPDATE no aísla columnas: la app debe limitarse a esos campos
-- (ver studentFinancialAccessActions.ts), pero la condición de USING /
-- WITH CHECK garantiza que el tutor_id no pueda cambiarse en el cliente.
DROP POLICY IF EXISTS tutor_student_rel_update_student_adult
  ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_update_student_adult
  ON public.tutor_student_rel FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.is_minor, false) = false
    )
  )
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.is_minor, false) = false
    )
  );

-- ========== 056_section_fee_plans_currency_and_simplify.sql ==========

-- Section fee plans: add multi-currency support and simplify the model.
--
-- Cambios respecto a 054_section_fee_plans.sql:
--   * ADD currency: ISO 4217 (3 letras mayúsculas), default 'USD'.
--   * DROP payments_count, period_start_year, period_start_month: el rango
--     temporal real lo dicta academic_sections.starts_on/ends_on. El prorrateo
--     del primer mes se calcula en la app desde el schedule_slots.
--
-- Decisión documentada en docs/adr/2026-04-section-fee-plans-currency-and-proration.md.

ALTER TABLE public.section_fee_plans
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'section_fee_plans_currency_iso4217'
  ) THEN
    ALTER TABLE public.section_fee_plans
      ADD CONSTRAINT section_fee_plans_currency_iso4217
      CHECK (currency ~ '^[A-Z]{3}$');
  END IF;
END $$;

COMMENT ON COLUMN public.section_fee_plans.currency IS
  'Código ISO 4217 (3 letras mayúsculas) en el que se cobra la cuota mensual de esta sección. Cada plan/sección puede tener su propia moneda.';

-- Drop columns + their CHECK constraints introduced in 054.
ALTER TABLE public.section_fee_plans
  DROP CONSTRAINT IF EXISTS section_fee_plans_payments_count_range,
  DROP CONSTRAINT IF EXISTS section_fee_plans_period_month_range,
  DROP CONSTRAINT IF EXISTS section_fee_plans_period_year_range;

ALTER TABLE public.section_fee_plans
  DROP COLUMN IF EXISTS payments_count,
  DROP COLUMN IF EXISTS period_start_year,
  DROP COLUMN IF EXISTS period_start_month;

COMMENT ON TABLE public.section_fee_plans IS
  'Planes de cuotas por sección. Cada plan tiene moneda + monto mensual + vigencia (effective_from). El plan activo para (year, month) es el más reciente con effective_from <= (year, month). El rango temporal real lo da academic_sections.starts_on/ends_on; el prorrateo del primer mes lo calcula la app a partir del schedule_slots.';

-- ========== 057_admin_cohort_collections_bulk.sql ==========

-- RPC: bulk fetch of all data needed to render the cohort collections matrix
-- (overview tab in /admin/finance). Returns one JSON document with sections,
-- enrollments, profiles, payments, scholarships and active fee plans for the
-- cohort + year, in a single round-trip.
--
-- Replaces the N+1 pattern of loadAdminCohortCollectionsOverview.ts that
-- iterated loadAdminSectionCollectionsView per section. ADR follow-up of
-- 2026-04-admin-section-collections-view.md and decision documented in
-- docs/adr/2026-04-finance-unification-tabs.md.
--
-- The function returns RAW data only — monetary computations (expected
-- amount, prorate, scholarship coverage, paid/overdue/upcoming status) are
-- composed by the application using the existing pure reducers in
-- src/lib/billing/** to avoid duplicating domain logic in plpgsql
-- (rules 03-architecture and complete-solutions-always).

CREATE OR REPLACE FUNCTION public.admin_cohort_collections_bulk(
  p_cohort_id uuid,
  p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort jsonb;
  v_sections jsonb;
  v_enrollments jsonb;
  v_profiles jsonb;
  v_payments jsonb;
  v_scholarships jsonb;
  v_plans jsonb;
  v_section_ids uuid[];
  v_student_ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid_year' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('id', c.id, 'name', c.name)
    INTO v_cohort
    FROM public.academic_cohorts c
    WHERE c.id = p_cohort_id;

  IF v_cohort IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', NULL,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(s.id), coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'archived_at', s.archived_at,
    'starts_on', s.starts_on,
    'ends_on', s.ends_on,
    'schedule_slots', coalesce(s.schedule_slots, '[]'::jsonb)
  ) ORDER BY s.name), '[]'::jsonb)
    INTO v_section_ids, v_sections
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL;

  IF v_section_ids IS NULL OR array_length(v_section_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(DISTINCT e.student_id), coalesce(jsonb_agg(jsonb_build_object(
    'section_id', e.section_id,
    'student_id', e.student_id,
    'created_at', e.created_at
  )), '[]'::jsonb)
    INTO v_student_ids, v_enrollments
    FROM public.section_enrollments e
    WHERE e.section_id = ANY(v_section_ids)
      AND e.status = 'active';

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', v_sections,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', fp.id,
          'section_id', fp.section_id,
          'effective_from_year', fp.effective_from_year,
          'effective_from_month', fp.effective_from_month,
          'monthly_fee', fp.monthly_fee,
          'currency', fp.currency,
          'charges_enrollment_fee', fp.charges_enrollment_fee,
          'archived_at', fp.archived_at
        ))
        FROM public.section_fee_plans fp
        WHERE fp.section_id = ANY(v_section_ids)
          AND fp.archived_at IS NULL
      ), '[]'::jsonb)
    );
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'dni_or_passport', p.dni_or_passport
  )), '[]'::jsonb)
    INTO v_profiles
    FROM public.profiles p
    WHERE p.id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', pay.id,
    'student_id', pay.student_id,
    'section_id', pay.section_id,
    'month', pay.month,
    'year', pay.year,
    'amount', pay.amount,
    'status', pay.status,
    'receipt_url', pay.receipt_url
  )), '[]'::jsonb)
    INTO v_payments
    FROM public.payments pay
    WHERE pay.year = p_year
      AND pay.section_id = ANY(v_section_ids)
      AND pay.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sc.student_id,
    'discount_percent', sc.discount_percent,
    'valid_from_year', sc.valid_from_year,
    'valid_from_month', sc.valid_from_month,
    'valid_until_year', sc.valid_until_year,
    'valid_until_month', sc.valid_until_month,
    'is_active', sc.is_active
  )), '[]'::jsonb)
    INTO v_scholarships
    FROM public.student_scholarships sc
    WHERE sc.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', fp.id,
    'section_id', fp.section_id,
    'effective_from_year', fp.effective_from_year,
    'effective_from_month', fp.effective_from_month,
    'monthly_fee', fp.monthly_fee,
    'currency', fp.currency,
    'charges_enrollment_fee', fp.charges_enrollment_fee,
    'archived_at', fp.archived_at
  )), '[]'::jsonb)
    INTO v_plans
    FROM public.section_fee_plans fp
    WHERE fp.section_id = ANY(v_section_ids)
      AND fp.archived_at IS NULL;

  RETURN jsonb_build_object(
    'cohort', v_cohort,
    'year', p_year,
    'sections', v_sections,
    'enrollments', v_enrollments,
    'profiles', v_profiles,
    'payments', v_payments,
    'scholarships', v_scholarships,
    'plans', v_plans
  );
END;
$$;

COMMENT ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) IS
  'Bulk fetch (admin only) of all raw data needed to render the cohort collections matrix in /admin/finance for a given cohort and year. Returns a single JSON document. Application composes payment status / expected amounts using src/lib/billing/** reducers. See ADR docs/adr/2026-04-finance-unification-tabs.md.';

REVOKE ALL ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) TO authenticated;

-- ========== 058_section_enrollment_fee.sql ==========

-- Section-level enrollment fee (matrícula).
--
-- Decisión documentada en docs/adr/2026-04-section-enrollment-fee.md.
--
-- Cambios:
--   * ADD academic_sections.enrollment_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0
--     CHECK (enrollment_fee_amount >= 0). 0 = la sección no cobra matrícula.
--     La moneda se reusa del plan vigente (section_fee_plans.currency).
--   * DROP section_fee_plans.charges_enrollment_fee: la fuente de verdad de
--     "esta sección cobra matrícula" pasa a ser enrollment_fee_amount > 0
--     en la sección. Evita estados inconsistentes (flag true con monto 0).

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS enrollment_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'academic_sections_enrollment_fee_nonneg'
  ) THEN
    ALTER TABLE public.academic_sections
      ADD CONSTRAINT academic_sections_enrollment_fee_nonneg
      CHECK (enrollment_fee_amount >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.academic_sections.enrollment_fee_amount IS
  'Monto de matrícula que cobra la sección, en la moneda del plan de cuotas vigente. 0 = la sección no cobra matrícula. La moneda no se almacena aquí: se toma de section_fee_plans.currency del plan activo para evitar duplicar el dato.';

-- Drop deprecated flag in section_fee_plans (the boolean was insufficient: it
-- told whether the section "charged" but never how much).
ALTER TABLE public.section_fee_plans
  DROP COLUMN IF EXISTS charges_enrollment_fee;

-- Redefine the cohort collections bulk RPC to align with the new model:
--   * sections payload now exposes `enrollment_fee_amount` so the application
--     can derive whether (and how much) matrícula the section charges.
--   * plans payload drops the deprecated `charges_enrollment_fee` field.
-- See migration 057_admin_cohort_collections_bulk.sql for the original.

CREATE OR REPLACE FUNCTION public.admin_cohort_collections_bulk(
  p_cohort_id uuid,
  p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort jsonb;
  v_sections jsonb;
  v_enrollments jsonb;
  v_profiles jsonb;
  v_payments jsonb;
  v_scholarships jsonb;
  v_plans jsonb;
  v_section_ids uuid[];
  v_student_ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid_year' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('id', c.id, 'name', c.name)
    INTO v_cohort
    FROM public.academic_cohorts c
    WHERE c.id = p_cohort_id;

  IF v_cohort IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', NULL,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(s.id), coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'archived_at', s.archived_at,
    'starts_on', s.starts_on,
    'ends_on', s.ends_on,
    'schedule_slots', coalesce(s.schedule_slots, '[]'::jsonb),
    'enrollment_fee_amount', s.enrollment_fee_amount
  ) ORDER BY s.name), '[]'::jsonb)
    INTO v_section_ids, v_sections
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL;

  IF v_section_ids IS NULL OR array_length(v_section_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(DISTINCT e.student_id), coalesce(jsonb_agg(jsonb_build_object(
    'section_id', e.section_id,
    'student_id', e.student_id,
    'created_at', e.created_at
  )), '[]'::jsonb)
    INTO v_student_ids, v_enrollments
    FROM public.section_enrollments e
    WHERE e.section_id = ANY(v_section_ids)
      AND e.status = 'active';

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', v_sections,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', fp.id,
          'section_id', fp.section_id,
          'effective_from_year', fp.effective_from_year,
          'effective_from_month', fp.effective_from_month,
          'monthly_fee', fp.monthly_fee,
          'currency', fp.currency,
          'archived_at', fp.archived_at
        ))
        FROM public.section_fee_plans fp
        WHERE fp.section_id = ANY(v_section_ids)
          AND fp.archived_at IS NULL
      ), '[]'::jsonb)
    );
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'dni_or_passport', p.dni_or_passport
  )), '[]'::jsonb)
    INTO v_profiles
    FROM public.profiles p
    WHERE p.id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', pay.id,
    'student_id', pay.student_id,
    'section_id', pay.section_id,
    'month', pay.month,
    'year', pay.year,
    'amount', pay.amount,
    'status', pay.status,
    'receipt_url', pay.receipt_url
  )), '[]'::jsonb)
    INTO v_payments
    FROM public.payments pay
    WHERE pay.year = p_year
      AND pay.section_id = ANY(v_section_ids)
      AND pay.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sc.student_id,
    'discount_percent', sc.discount_percent,
    'valid_from_year', sc.valid_from_year,
    'valid_from_month', sc.valid_from_month,
    'valid_until_year', sc.valid_until_year,
    'valid_until_month', sc.valid_until_month,
    'is_active', sc.is_active
  )), '[]'::jsonb)
    INTO v_scholarships
    FROM public.student_scholarships sc
    WHERE sc.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', fp.id,
    'section_id', fp.section_id,
    'effective_from_year', fp.effective_from_year,
    'effective_from_month', fp.effective_from_month,
    'monthly_fee', fp.monthly_fee,
    'currency', fp.currency,
    'archived_at', fp.archived_at
  )), '[]'::jsonb)
    INTO v_plans
    FROM public.section_fee_plans fp
    WHERE fp.section_id = ANY(v_section_ids)
      AND fp.archived_at IS NULL;

  RETURN jsonb_build_object(
    'cohort', v_cohort,
    'year', p_year,
    'sections', v_sections,
    'enrollments', v_enrollments,
    'profiles', v_profiles,
    'payments', v_payments,
    'scholarships', v_scholarships,
    'plans', v_plans
  );
END;
$$;

-- ========== 059_admin_cohort_collections_profile_dni.sql ==========

-- Fix admin cohort collections RPC profile payload to match the real profiles schema.
--
-- `profiles.document_number` never existed in this schema; the canonical
-- student identifier is `profiles.dni_or_passport`.

CREATE OR REPLACE FUNCTION public.admin_cohort_collections_bulk(
  p_cohort_id uuid,
  p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort jsonb;
  v_sections jsonb;
  v_enrollments jsonb;
  v_profiles jsonb;
  v_payments jsonb;
  v_scholarships jsonb;
  v_plans jsonb;
  v_section_ids uuid[];
  v_student_ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid_year' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('id', c.id, 'name', c.name)
    INTO v_cohort
    FROM public.academic_cohorts c
    WHERE c.id = p_cohort_id;

  IF v_cohort IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', NULL,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(s.id), coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'archived_at', s.archived_at,
    'starts_on', s.starts_on,
    'ends_on', s.ends_on,
    'schedule_slots', coalesce(s.schedule_slots, '[]'::jsonb),
    'enrollment_fee_amount', s.enrollment_fee_amount
  ) ORDER BY s.name), '[]'::jsonb)
    INTO v_section_ids, v_sections
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL;

  IF v_section_ids IS NULL OR array_length(v_section_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(DISTINCT e.student_id), coalesce(jsonb_agg(jsonb_build_object(
    'section_id', e.section_id,
    'student_id', e.student_id,
    'created_at', e.created_at
  )), '[]'::jsonb)
    INTO v_student_ids, v_enrollments
    FROM public.section_enrollments e
    WHERE e.section_id = ANY(v_section_ids)
      AND e.status = 'active';

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', v_sections,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', fp.id,
          'section_id', fp.section_id,
          'effective_from_year', fp.effective_from_year,
          'effective_from_month', fp.effective_from_month,
          'monthly_fee', fp.monthly_fee,
          'currency', fp.currency,
          'archived_at', fp.archived_at
        ))
        FROM public.section_fee_plans fp
        WHERE fp.section_id = ANY(v_section_ids)
          AND fp.archived_at IS NULL
      ), '[]'::jsonb)
    );
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'dni_or_passport', p.dni_or_passport
  )), '[]'::jsonb)
    INTO v_profiles
    FROM public.profiles p
    WHERE p.id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', pay.id,
    'student_id', pay.student_id,
    'section_id', pay.section_id,
    'month', pay.month,
    'year', pay.year,
    'amount', pay.amount,
    'status', pay.status,
    'receipt_url', pay.receipt_url
  )), '[]'::jsonb)
    INTO v_payments
    FROM public.payments pay
    WHERE pay.year = p_year
      AND pay.section_id = ANY(v_section_ids)
      AND pay.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sc.student_id,
    'discount_percent', sc.discount_percent,
    'valid_from_year', sc.valid_from_year,
    'valid_from_month', sc.valid_from_month,
    'valid_until_year', sc.valid_until_year,
    'valid_until_month', sc.valid_until_month,
    'is_active', sc.is_active
  )), '[]'::jsonb)
    INTO v_scholarships
    FROM public.student_scholarships sc
    WHERE sc.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', fp.id,
    'section_id', fp.section_id,
    'effective_from_year', fp.effective_from_year,
    'effective_from_month', fp.effective_from_month,
    'monthly_fee', fp.monthly_fee,
    'currency', fp.currency,
    'archived_at', fp.archived_at
  )), '[]'::jsonb)
    INTO v_plans
    FROM public.section_fee_plans fp
    WHERE fp.section_id = ANY(v_section_ids)
      AND fp.archived_at IS NULL;

  RETURN jsonb_build_object(
    'cohort', v_cohort,
    'year', p_year,
    'sections', v_sections,
    'enrollments', v_enrollments,
    'profiles', v_profiles,
    'payments', v_payments,
    'scholarships', v_scholarships,
    'plans', v_plans
  );
END;
$$;

COMMENT ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) IS
  'Bulk fetch (admin only) of raw cohort collections data. Profile rows expose dni_or_passport from the canonical profiles schema.';

REVOKE ALL ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) TO authenticated;

-- ========== 060_payments_section_id_backfill.sql ==========

-- Ensure section-scoped payments exist for the finance cohort matrix.
--
-- Migration 054 introduced `payments.section_id`; some environments may have
-- section fee plans without this column. Keep this migration idempotent so the
-- finance RPC and loaders can rely on the section-aware payment model.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS section_id UUID
    REFERENCES public.academic_sections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_section_idx ON public.payments (section_id);

DO $$
BEGIN
  ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_student_period_uidx;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DROP INDEX IF EXISTS public.payments_student_period_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_section_period_uidx
  ON public.payments (student_id, section_id, month, year)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_legacy_period_uidx
  ON public.payments (student_id, month, year)
  WHERE section_id IS NULL;

-- Best-effort attribution for legacy pending/approved rows. If a student has
-- exactly one active section, the legacy payment clearly belongs to it. Rows for
-- students with multiple active sections stay NULL to avoid corrupt attribution.
WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.section_id ORDER BY se.section_id::text))[1] AS section_id,
    count(DISTINCT se.section_id) AS section_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.payments p
SET section_id = sas.section_id
FROM single_active_section sas
WHERE p.section_id IS NULL
  AND p.student_id = sas.student_id
  AND sas.section_count = 1;

DROP POLICY IF EXISTS payments_insert_student_self ON public.payments;
CREATE POLICY payments_insert_student_self
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
    AND section_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.section_enrollments se
      WHERE se.student_id = auth.uid()
        AND se.section_id = payments.section_id
        AND se.status = 'active'
    )
  );

DROP POLICY IF EXISTS payments_update_student_self ON public.payments;
CREATE POLICY payments_update_student_self
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );

-- ========== 061_student_scholarships_repair.sql ==========

-- Ensure scholarship tables exist for billing and finance summaries.
--
-- Some environments may have section fee plans and finance RPCs applied while
-- missing the older billing-scholarships migration. This repair keeps the
-- scholarship/coupon schema idempotent so finance loaders can always read the
-- optional scholarship discount set.

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

CREATE UNIQUE INDEX IF NOT EXISTS discount_coupons_code_lower_uidx
  ON public.discount_coupons (lower(trim(code)));

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
DO $$
DECLARE
  v_using text := 'public.is_admin(auth.uid()) OR student_id = auth.uid()';
BEGIN
  IF to_regclass('public.parent_student') IS NOT NULL THEN
    v_using := v_using || ' OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid()
        AND ps.student_id = student_scholarships.student_id
    )';
  END IF;

  IF to_regclass('public.tutor_student_rel') IS NOT NULL THEN
    v_using := v_using || ' OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND ts.student_id = student_scholarships.student_id
        AND ts.financial_access_revoked_at IS NULL
    )';
  END IF;

  EXECUTE 'CREATE POLICY student_scholarships_select
    ON public.student_scholarships FOR SELECT
    TO authenticated
    USING (' || v_using || ')';
END $$;

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

-- ========== 062_admin_cohort_collections_benefits.sql ==========

-- Include enrollment-fee exemptions and active promotion metadata in the
-- finance cohort collections bulk payload.

CREATE OR REPLACE FUNCTION public.admin_cohort_collections_bulk(
  p_cohort_id uuid,
  p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort jsonb;
  v_sections jsonb;
  v_enrollments jsonb;
  v_profiles jsonb;
  v_payments jsonb;
  v_scholarships jsonb;
  v_promotions jsonb;
  v_plans jsonb;
  v_section_ids uuid[];
  v_student_ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid_year' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('id', c.id, 'name', c.name)
    INTO v_cohort
    FROM public.academic_cohorts c
    WHERE c.id = p_cohort_id;

  IF v_cohort IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', NULL,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'promotions', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(s.id), coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'archived_at', s.archived_at,
    'starts_on', s.starts_on,
    'ends_on', s.ends_on,
    'schedule_slots', coalesce(s.schedule_slots, '[]'::jsonb),
    'enrollment_fee_amount', s.enrollment_fee_amount
  ) ORDER BY s.name), '[]'::jsonb)
    INTO v_section_ids, v_sections
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL;

  IF v_section_ids IS NULL OR array_length(v_section_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'promotions', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(DISTINCT e.student_id), coalesce(jsonb_agg(jsonb_build_object(
    'section_id', e.section_id,
    'student_id', e.student_id,
    'created_at', e.created_at
  )), '[]'::jsonb)
    INTO v_student_ids, v_enrollments
    FROM public.section_enrollments e
    WHERE e.section_id = ANY(v_section_ids)
      AND e.status = 'active';

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', v_sections,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'promotions', '[]'::jsonb,
      'plans', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', fp.id,
          'section_id', fp.section_id,
          'effective_from_year', fp.effective_from_year,
          'effective_from_month', fp.effective_from_month,
          'monthly_fee', fp.monthly_fee,
          'currency', fp.currency,
          'archived_at', fp.archived_at
        ))
        FROM public.section_fee_plans fp
        WHERE fp.section_id = ANY(v_section_ids)
          AND fp.archived_at IS NULL
      ), '[]'::jsonb)
    );
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'dni_or_passport', p.dni_or_passport,
    'enrollment_fee_exempt', p.enrollment_fee_exempt,
    'enrollment_exempt_reason', p.enrollment_exempt_reason
  )), '[]'::jsonb)
    INTO v_profiles
    FROM public.profiles p
    WHERE p.id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', pay.id,
    'student_id', pay.student_id,
    'section_id', pay.section_id,
    'month', pay.month,
    'year', pay.year,
    'amount', pay.amount,
    'status', pay.status,
    'receipt_url', pay.receipt_url
  )), '[]'::jsonb)
    INTO v_payments
    FROM public.payments pay
    WHERE pay.year = p_year
      AND pay.section_id = ANY(v_section_ids)
      AND pay.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sc.student_id,
    'discount_percent', sc.discount_percent,
    'valid_from_year', sc.valid_from_year,
    'valid_from_month', sc.valid_from_month,
    'valid_until_year', sc.valid_until_year,
    'valid_until_month', sc.valid_until_month,
    'is_active', sc.is_active
  )), '[]'::jsonb)
    INTO v_scholarships
    FROM public.student_scholarships sc
    WHERE sc.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sp.student_id,
    'code_snapshot', sp.code_snapshot,
    'promotion_snapshot', sp.promotion_snapshot,
    'applies_to_snapshot', sp.applies_to_snapshot,
    'monthly_months_remaining', sp.monthly_months_remaining,
    'enrollment_consumed', sp.enrollment_consumed,
    'applied_at', sp.applied_at
  ) ORDER BY sp.applied_at DESC), '[]'::jsonb)
    INTO v_promotions
    FROM public.student_promotions sp
    WHERE sp.student_id = ANY(v_student_ids)
      AND (
        (
          sp.applies_to_snapshot IN ('enrollment', 'both')
          AND NOT sp.enrollment_consumed
        )
        OR (
          sp.applies_to_snapshot IN ('monthly', 'both')
          AND (
            sp.monthly_months_remaining IS NULL
            OR sp.monthly_months_remaining > 0
          )
        )
      );

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', fp.id,
    'section_id', fp.section_id,
    'effective_from_year', fp.effective_from_year,
    'effective_from_month', fp.effective_from_month,
    'monthly_fee', fp.monthly_fee,
    'currency', fp.currency,
    'archived_at', fp.archived_at
  )), '[]'::jsonb)
    INTO v_plans
    FROM public.section_fee_plans fp
    WHERE fp.section_id = ANY(v_section_ids)
      AND fp.archived_at IS NULL;

  RETURN jsonb_build_object(
    'cohort', v_cohort,
    'year', p_year,
    'sections', v_sections,
    'enrollments', v_enrollments,
    'profiles', v_profiles,
    'payments', v_payments,
    'scholarships', v_scholarships,
    'promotions', v_promotions,
    'plans', v_plans
  );
END;
$$;

COMMENT ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) IS
  'Bulk fetch (admin only) of raw cohort collections data, including student billing benefits for finance indicators.';

REVOKE ALL ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) TO authenticated;

-- ========== 063_period_exemptions_section_repair.sql ==========

-- Repair period exemptions created without section_id.
--
-- Finance section matrices only count section-scoped payments. The admin
-- period-exemption action briefly created legacy rows with section_id NULL;
-- when the student has exactly one active section, the intended section is
-- unambiguous and can be repaired safely.

WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.section_id ORDER BY se.section_id::text))[1] AS section_id,
    count(DISTINCT se.section_id) AS section_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.payments p
SET section_id = sas.section_id
FROM single_active_section sas
WHERE p.section_id IS NULL
  AND p.student_id = sas.student_id
  AND sas.section_count = 1
  AND p.status = 'exempt'
  AND NOT EXISTS (
    SELECT 1
    FROM public.payments scoped
    WHERE scoped.student_id = p.student_id
      AND scoped.section_id = sas.section_id
      AND scoped.month = p.month
      AND scoped.year = p.year
  );

-- ========== 064_section_enrollment_billing_benefits.sql ==========

-- Section-scoped billing benefits.
--
-- Benefits belong to the student-section enrollment, not to the student
-- globally: one student can attend multiple active sections with different
-- enrollment-fee exemptions or scholarship percentages.

ALTER TABLE public.section_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_fee_exempt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_reason TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_authorized_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_enrollment_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scholarship_discount_percent NUMERIC(5, 2) CHECK (
    scholarship_discount_percent IS NULL
    OR (scholarship_discount_percent >= 0 AND scholarship_discount_percent <= 100)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_note TEXT,
  ADD COLUMN IF NOT EXISTS scholarship_valid_from_year INT CHECK (
    scholarship_valid_from_year IS NULL
    OR (scholarship_valid_from_year >= 2000 AND scholarship_valid_from_year <= 2100)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_valid_from_month INT CHECK (
    scholarship_valid_from_month IS NULL
    OR (scholarship_valid_from_month >= 1 AND scholarship_valid_from_month <= 12)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_valid_until_year INT CHECK (
    scholarship_valid_until_year IS NULL
    OR (scholarship_valid_until_year >= 2000 AND scholarship_valid_until_year <= 2100)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_valid_until_month INT CHECK (
    scholarship_valid_until_month IS NULL
    OR (scholarship_valid_until_month >= 1 AND scholarship_valid_until_month <= 12)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_is_active BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS section_enrollments_student_section_benefits_idx
  ON public.section_enrollments (student_id, section_id)
  WHERE status = 'active';

WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.id ORDER BY se.created_at DESC, se.id))[1] AS enrollment_id,
    count(*) AS active_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.section_enrollments se
SET
  enrollment_fee_exempt = p.enrollment_fee_exempt,
  enrollment_exempt_reason = p.enrollment_exempt_reason,
  enrollment_exempt_authorized_by = p.enrollment_exempt_authorized_by,
  enrollment_exempt_at = p.enrollment_exempt_at,
  last_enrollment_paid_at = p.last_enrollment_paid_at
FROM single_active_section sas
JOIN public.profiles p ON p.id = sas.student_id
WHERE se.id = sas.enrollment_id
  AND sas.active_count = 1
  AND (
    p.enrollment_fee_exempt = true
    OR p.last_enrollment_paid_at IS NOT NULL
  );

WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.id ORDER BY se.created_at DESC, se.id))[1] AS enrollment_id,
    count(*) AS active_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.section_enrollments se
SET
  scholarship_discount_percent = sc.discount_percent,
  scholarship_note = sc.note,
  scholarship_valid_from_year = sc.valid_from_year,
  scholarship_valid_from_month = sc.valid_from_month,
  scholarship_valid_until_year = sc.valid_until_year,
  scholarship_valid_until_month = sc.valid_until_month,
  scholarship_is_active = sc.is_active
FROM single_active_section sas
JOIN public.student_scholarships sc ON sc.student_id = sas.student_id
WHERE se.id = sas.enrollment_id
  AND sas.active_count = 1;

-- ========== 065_section_enrollment_scholarships.sql ==========

-- Multiple section-scoped scholarships.
--
-- A student can have several scholarships in the same section enrollment. Active
-- scholarships that cover the same month are summed by the app and capped at 100%.

CREATE TABLE IF NOT EXISTS public.section_enrollment_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  discount_percent NUMERIC(5, 2) NOT NULL CHECK (
    discount_percent >= 0 AND discount_percent <= 100
  ),
  note TEXT,
  valid_from_year INT NOT NULL CHECK (valid_from_year >= 2000 AND valid_from_year <= 2100),
  valid_from_month INT NOT NULL CHECK (valid_from_month >= 1 AND valid_from_month <= 12),
  valid_until_year INT CHECK (valid_until_year IS NULL OR (valid_until_year >= 2000 AND valid_until_year <= 2100)),
  valid_until_month INT CHECK (valid_until_month IS NULL OR (valid_until_month >= 1 AND valid_until_month <= 12)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_enrollment_scholarships_period_order CHECK (
    valid_until_year IS NULL
    OR valid_until_month IS NULL
    OR (valid_until_year * 12 + valid_until_month) >= (valid_from_year * 12 + valid_from_month)
  )
);

CREATE INDEX IF NOT EXISTS section_enrollment_scholarships_enrollment_idx
  ON public.section_enrollment_scholarships (enrollment_id);

CREATE INDEX IF NOT EXISTS section_enrollment_scholarships_scope_idx
  ON public.section_enrollment_scholarships (section_id, student_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS section_enrollment_scholarships_legacy_backfill_once
  ON public.section_enrollment_scholarships (enrollment_id)
  WHERE note = 'Migrated from section_enrollments scholarship fields';

ALTER TABLE public.section_enrollment_scholarships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_enrollment_scholarships_select_scope ON public.section_enrollment_scholarships;
CREATE POLICY section_enrollment_scholarships_select_scope ON public.section_enrollment_scholarships
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND ts.student_id = section_enrollment_scholarships.student_id
    )
    OR public.user_leads_or_assists_section(auth.uid(), section_enrollment_scholarships.section_id)
  );

DROP POLICY IF EXISTS section_enrollment_scholarships_admin_write ON public.section_enrollment_scholarships;
CREATE POLICY section_enrollment_scholarships_admin_write ON public.section_enrollment_scholarships
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.section_enrollment_scholarships (
  enrollment_id,
  section_id,
  student_id,
  discount_percent,
  note,
  valid_from_year,
  valid_from_month,
  valid_until_year,
  valid_until_month,
  is_active
)
SELECT
  se.id,
  se.section_id,
  se.student_id,
  se.scholarship_discount_percent,
  COALESCE(se.scholarship_note, 'Migrated from section_enrollments scholarship fields'),
  se.scholarship_valid_from_year,
  se.scholarship_valid_from_month,
  se.scholarship_valid_until_year,
  se.scholarship_valid_until_month,
  COALESCE(se.scholarship_is_active, false)
FROM public.section_enrollments se
WHERE se.scholarship_discount_percent IS NOT NULL
  AND se.scholarship_valid_from_year IS NOT NULL
  AND se.scholarship_valid_from_month IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.section_enrollment_scholarships ses
    WHERE ses.enrollment_id = se.id
      AND ses.discount_percent = se.scholarship_discount_percent
      AND ses.valid_from_year = se.scholarship_valid_from_year
      AND ses.valid_from_month = se.scholarship_valid_from_month
      AND COALESCE(ses.valid_until_year, -1) = COALESCE(se.scholarship_valid_until_year, -1)
      AND COALESCE(ses.valid_until_month, -1) = COALESCE(se.scholarship_valid_until_month, -1)
  );

-- ========== 066_admin_cohort_collections_multiple_scholarships.sql ==========

-- Finance bulk RPC now emits section-enrollment scholarships, not global rows.

CREATE OR REPLACE FUNCTION public.admin_cohort_collections_bulk(
  p_cohort_id uuid,
  p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort jsonb;
  v_sections jsonb;
  v_enrollments jsonb;
  v_profiles jsonb;
  v_payments jsonb;
  v_scholarships jsonb;
  v_promotions jsonb;
  v_plans jsonb;
  v_section_ids uuid[];
  v_student_ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid_year' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('id', c.id, 'name', c.name)
    INTO v_cohort
    FROM public.academic_cohorts c
    WHERE c.id = p_cohort_id;

  IF v_cohort IS NULL THEN
    RETURN jsonb_build_object('cohort', NULL, 'year', p_year, 'sections', '[]'::jsonb, 'enrollments', '[]'::jsonb, 'profiles', '[]'::jsonb, 'payments', '[]'::jsonb, 'scholarships', '[]'::jsonb, 'promotions', '[]'::jsonb, 'plans', '[]'::jsonb);
  END IF;

  SELECT array_agg(s.id), coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'archived_at', s.archived_at,
    'starts_on', s.starts_on,
    'ends_on', s.ends_on,
    'schedule_slots', coalesce(s.schedule_slots, '[]'::jsonb),
    'enrollment_fee_amount', s.enrollment_fee_amount
  ) ORDER BY s.name), '[]'::jsonb)
    INTO v_section_ids, v_sections
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL;

  IF v_section_ids IS NULL OR array_length(v_section_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('cohort', v_cohort, 'year', p_year, 'sections', '[]'::jsonb, 'enrollments', '[]'::jsonb, 'profiles', '[]'::jsonb, 'payments', '[]'::jsonb, 'scholarships', '[]'::jsonb, 'promotions', '[]'::jsonb, 'plans', '[]'::jsonb);
  END IF;

  SELECT array_agg(DISTINCT e.student_id), coalesce(jsonb_agg(jsonb_build_object(
    'section_id', e.section_id,
    'student_id', e.student_id,
    'created_at', e.created_at,
    'enrollment_fee_exempt', e.enrollment_fee_exempt,
    'enrollment_exempt_reason', e.enrollment_exempt_reason
  )), '[]'::jsonb)
    INTO v_student_ids, v_enrollments
    FROM public.section_enrollments e
    WHERE e.section_id = ANY(v_section_ids)
      AND e.status = 'active';

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', v_sections,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'promotions', '[]'::jsonb,
      'plans', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', fp.id,
          'section_id', fp.section_id,
          'effective_from_year', fp.effective_from_year,
          'effective_from_month', fp.effective_from_month,
          'monthly_fee', fp.monthly_fee,
          'currency', fp.currency,
          'archived_at', fp.archived_at
        ))
        FROM public.section_fee_plans fp
        WHERE fp.section_id = ANY(v_section_ids)
          AND fp.archived_at IS NULL
      ), '[]'::jsonb)
    );
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'dni_or_passport', p.dni_or_passport,
    'enrollment_fee_exempt', p.enrollment_fee_exempt,
    'enrollment_exempt_reason', p.enrollment_exempt_reason
  )), '[]'::jsonb)
    INTO v_profiles
    FROM public.profiles p
    WHERE p.id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', pay.id,
    'student_id', pay.student_id,
    'section_id', pay.section_id,
    'month', pay.month,
    'year', pay.year,
    'amount', pay.amount,
    'status', pay.status,
    'receipt_url', pay.receipt_url
  )), '[]'::jsonb)
    INTO v_payments
    FROM public.payments pay
    WHERE pay.year = p_year
      AND pay.section_id = ANY(v_section_ids)
      AND pay.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', sc.id,
    'section_id', sc.section_id,
    'student_id', sc.student_id,
    'discount_percent', sc.discount_percent,
    'note', sc.note,
    'valid_from_year', sc.valid_from_year,
    'valid_from_month', sc.valid_from_month,
    'valid_until_year', sc.valid_until_year,
    'valid_until_month', sc.valid_until_month,
    'is_active', sc.is_active
  ) ORDER BY sc.created_at), '[]'::jsonb)
    INTO v_scholarships
    FROM public.section_enrollment_scholarships sc
    WHERE sc.section_id = ANY(v_section_ids)
      AND sc.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sp.student_id,
    'code_snapshot', sp.code_snapshot,
    'promotion_snapshot', sp.promotion_snapshot,
    'applies_to_snapshot', sp.applies_to_snapshot,
    'monthly_months_remaining', sp.monthly_months_remaining,
    'enrollment_consumed', sp.enrollment_consumed,
    'applied_at', sp.applied_at
  ) ORDER BY sp.applied_at DESC), '[]'::jsonb)
    INTO v_promotions
    FROM public.student_promotions sp
    WHERE sp.student_id = ANY(v_student_ids)
      AND (
        (sp.applies_to_snapshot IN ('enrollment', 'both') AND NOT sp.enrollment_consumed)
        OR (
          sp.applies_to_snapshot IN ('monthly', 'both')
          AND (sp.monthly_months_remaining IS NULL OR sp.monthly_months_remaining > 0)
        )
      );

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', fp.id,
    'section_id', fp.section_id,
    'effective_from_year', fp.effective_from_year,
    'effective_from_month', fp.effective_from_month,
    'monthly_fee', fp.monthly_fee,
    'currency', fp.currency,
    'archived_at', fp.archived_at
  )), '[]'::jsonb)
    INTO v_plans
    FROM public.section_fee_plans fp
    WHERE fp.section_id = ANY(v_section_ids)
      AND fp.archived_at IS NULL;

  RETURN jsonb_build_object(
    'cohort', v_cohort,
    'year', p_year,
    'sections', v_sections,
    'enrollments', v_enrollments,
    'profiles', v_profiles,
    'payments', v_payments,
    'scholarships', v_scholarships,
    'promotions', v_promotions,
    'plans', v_plans
  );
END;
$$;

COMMENT ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) IS
  'Bulk fetch (admin only) of raw cohort collections data, including section enrollment scholarships.';

REVOKE ALL ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) TO authenticated;

-- ========== 067_enrollment_fee_receipt.sql ==========

-- Migration 067: enrollment fee receipt upload (student/parent/tutor)
--
-- Students, parents and tutors can upload a payment receipt for the enrollment
-- fee charged per academic section.  The receipt is stored in the existing
-- `payment-receipts` storage bucket under the path
--   {student_id}/enrollment-fee/{enrollment_id}-{timestamp}.{ext}
-- The path always starts with the student's own UUID, which satisfies the RLS
-- check already in use for monthly payment receipts.
--
-- Admin can then approve or reject the receipt from the billing tab.
-- Approval also records `last_enrollment_paid_at` automatically.

ALTER TABLE public.section_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_url        TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_status     TEXT
    CONSTRAINT section_enrollments_receipt_status_check
    CHECK (enrollment_fee_receipt_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_url IS
  'Storage path in the payment-receipts bucket for the enrollment fee receipt uploaded by the student / parent.';
COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_status IS
  'Review status of the enrollment fee receipt: pending | approved | rejected.';
COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_uploaded_at IS
  'When the student/parent last uploaded the enrollment fee receipt.';

CREATE OR REPLACE FUNCTION public.submit_enrollment_fee_receipt(
  p_student_id UUID,
  p_enrollment_id UUID,
  p_section_id UUID,
  p_receipt_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_role TEXT;
  v_enrollment public.section_enrollments%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000';
  END IF;

  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF p_student_id = v_actor_id THEN
    IF v_actor_role <> 'student' THEN
      RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
  ELSIF v_actor_role <> 'parent'
    OR NOT public.tutor_can_view_student_finance(v_actor_id, p_student_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_receipt_url IS NULL
    OR btrim(p_receipt_url) = ''
    OR p_receipt_url LIKE '%..%'
    OR p_receipt_url NOT LIKE (p_student_id::TEXT || '/enrollment-fee/%') THEN
    RAISE EXCEPTION 'invalid_receipt_url' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_enrollment
  FROM public.section_enrollments
  WHERE id = p_enrollment_id
    AND student_id = p_student_id
    AND section_id = p_section_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'enrollment_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_enrollment.enrollment_fee_exempt, false) THEN
    RAISE EXCEPTION 'enrollment_fee_exempt' USING ERRCODE = '23514';
  END IF;

  IF v_enrollment.enrollment_fee_receipt_status = 'approved' THEN
    RAISE EXCEPTION 'enrollment_receipt_already_approved' USING ERRCODE = '23514';
  END IF;

  UPDATE public.section_enrollments
  SET
    enrollment_fee_receipt_url = p_receipt_url,
    enrollment_fee_receipt_status = 'pending',
    enrollment_fee_receipt_uploaded_at = now()
  WHERE id = v_enrollment.id;

  RETURN v_enrollment.id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_enrollment_fee_receipt(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_enrollment_fee_receipt(UUID, UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.submit_enrollment_fee_receipt(UUID, UUID, UUID, TEXT) IS
  'Persists a student/tutor enrollment fee receipt on section_enrollments after actor and path validation; avoids broad RLS UPDATE on the enrollment row.';

-- ========== 068_enrollment_retention_contact_counts.sql ==========

-- Retention alerts: per-enrollment WhatsApp vs email follow-up counts; drops manual `watch`.
--
-- PREREQ: `public.section_enrollments` must exist (created in 017_academic_cohorts_sections.sql and
-- related chain). RLS policies below reference `public.section_enrollment_teacher_is_self` from
-- 020_section_attendance_grades_retention.sql — apply migrations in order (or `supabase db push`
-- from an empty database with the full migration set), do not run this file alone on an empty DB.

DO $$
BEGIN
  IF to_regclass('public.section_enrollments') IS NULL THEN
    RAISE EXCEPTION
      'Migration 068 requires public.section_enrollments. Apply prior migrations first (e.g. 017_academic_cohorts_sections.sql and dependencies, or the full supabase/migrations/ chain).'
      USING ERRCODE = '42P01';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    INNER JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'section_enrollment_teacher_is_self'
  ) THEN
    RAISE EXCEPTION
      'Migration 068 requires public.section_enrollment_teacher_is_self. Apply 020_section_attendance_grades_retention.sql (or earlier) before 068.'
      USING ERRCODE = '42883';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.enrollment_retention_flags (
  enrollment_id UUID PRIMARY KEY REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  whatsapp_contact_count integer NOT NULL DEFAULT 0,
  email_contact_count integer NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legacy shape from 020 (watch only): add counts, then drop watch.
ALTER TABLE public.enrollment_retention_flags
  ADD COLUMN IF NOT EXISTS whatsapp_contact_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.enrollment_retention_flags
  ADD COLUMN IF NOT EXISTS email_contact_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.enrollment_retention_flags
  DROP CONSTRAINT IF EXISTS enrollment_retention_flags_whatsapp_count_nonneg;
ALTER TABLE public.enrollment_retention_flags
  ADD CONSTRAINT enrollment_retention_flags_whatsapp_count_nonneg
  CHECK (whatsapp_contact_count >= 0);

ALTER TABLE public.enrollment_retention_flags
  DROP CONSTRAINT IF EXISTS enrollment_retention_flags_email_count_nonneg;
ALTER TABLE public.enrollment_retention_flags
  ADD CONSTRAINT enrollment_retention_flags_email_count_nonneg
  CHECK (email_contact_count >= 0);

ALTER TABLE public.enrollment_retention_flags
  DROP COLUMN IF EXISTS watch;

ALTER TABLE public.enrollment_retention_flags ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.increment_enrollment_retention_contact(
  p_enrollment_id uuid,
  p_channel text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_channel IS NULL OR p_channel NOT IN ('whatsapp', 'email') THEN
    RAISE EXCEPTION 'invalid channel' USING ERRCODE = '22023';
  END IF;
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.enrollment_retention_flags (
    enrollment_id,
    whatsapp_contact_count,
    email_contact_count,
    updated_at
  )
  VALUES (
    p_enrollment_id,
    CASE WHEN p_channel = 'whatsapp' THEN 1 ELSE 0 END,
    CASE WHEN p_channel = 'email' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (enrollment_id) DO UPDATE SET
    whatsapp_contact_count = public.enrollment_retention_flags.whatsapp_contact_count
      + (CASE WHEN p_channel = 'whatsapp' THEN 1 ELSE 0 END),
    email_contact_count = public.enrollment_retention_flags.email_contact_count
      + (CASE WHEN p_channel = 'email' THEN 1 ELSE 0 END),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_enrollment_retention_contact(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_enrollment_retention_contact(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.increment_enrollment_retention_contact(uuid, text) IS
  'Admin: atomically increment WhatsApp or email follow-up count for a section enrollment (retention alerts).';

-- ========== 069_learning_task_core.sql ==========

-- Learning task core: master templates, section instances, student progress.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_asset_kind') THEN
    CREATE TYPE public.content_asset_kind AS ENUM ('file', 'embed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_embed_provider') THEN
    CREATE TYPE public.content_embed_provider AS ENUM ('youtube', 'vimeo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_progress_status') THEN
    CREATE TYPE public.task_progress_status AS ENUM ('NOT_OPENED', 'OPENED', 'COMPLETED', 'COMPLETED_LATE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  description TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL CHECK (char_length(body_html) BETWEEN 1 AND 80000),
  archived_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.content_templates (id) ON DELETE CASCADE,
  kind public.content_asset_kind NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 180),
  storage_path TEXT NULL,
  mime_type TEXT NULL,
  byte_size BIGINT NULL CHECK (byte_size IS NULL OR byte_size BETWEEN 1 AND 52428800),
  embed_provider public.content_embed_provider NULL,
  embed_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_template_assets_shape CHECK (
    (kind = 'file' AND storage_path IS NOT NULL AND mime_type IS NOT NULL AND byte_size IS NOT NULL
      AND embed_provider IS NULL AND embed_url IS NULL)
    OR
    (kind = 'embed' AND storage_path IS NULL AND mime_type IS NULL AND byte_size IS NULL
      AND embed_provider IS NOT NULL AND embed_url IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NULL REFERENCES public.content_templates (id) ON DELETE SET NULL,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  body_html TEXT NOT NULL CHECK (char_length(body_html) BETWEEN 1 AND 80000),
  start_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_instances_due_after_start CHECK (due_at >= start_at)
);

CREATE TABLE IF NOT EXISTS public.task_instance_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id UUID NOT NULL REFERENCES public.task_instances (id) ON DELETE CASCADE,
  template_asset_id UUID NULL REFERENCES public.content_template_assets (id) ON DELETE SET NULL,
  kind public.content_asset_kind NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 180),
  storage_path TEXT NULL,
  mime_type TEXT NULL,
  byte_size BIGINT NULL CHECK (byte_size IS NULL OR byte_size BETWEEN 1 AND 52428800),
  embed_provider public.content_embed_provider NULL,
  embed_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_instance_assets_shape CHECK (
    (kind = 'file' AND storage_path IS NOT NULL AND mime_type IS NOT NULL AND byte_size IS NOT NULL
      AND embed_provider IS NULL AND embed_url IS NULL)
    OR
    (kind = 'embed' AND storage_path IS NULL AND mime_type IS NULL AND byte_size IS NULL
      AND embed_provider IS NOT NULL AND embed_url IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.student_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id UUID NOT NULL REFERENCES public.task_instances (id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.task_progress_status NOT NULL DEFAULT 'NOT_OPENED',
  opened_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_task_progress_uidx UNIQUE (task_instance_id, enrollment_id),
  CONSTRAINT student_task_progress_completion_shape CHECK (
    (status IN ('COMPLETED', 'COMPLETED_LATE') AND completed_at IS NOT NULL AND opened_at IS NOT NULL)
    OR (status = 'OPENED' AND opened_at IS NOT NULL AND completed_at IS NULL)
    OR (status = 'NOT_OPENED' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS content_templates_list_idx
  ON public.content_templates (archived_at NULLS FIRST, updated_at DESC);
CREATE INDEX IF NOT EXISTS content_template_assets_template_idx
  ON public.content_template_assets (template_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS task_instances_section_due_idx
  ON public.task_instances (section_id, archived_at, due_at DESC);
CREATE INDEX IF NOT EXISTS task_instance_assets_instance_idx
  ON public.task_instance_assets (task_instance_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS student_task_progress_student_status_idx
  ON public.student_task_progress (student_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS student_task_progress_task_status_idx
  ON public.student_task_progress (task_instance_id, status);

DROP TRIGGER IF EXISTS content_templates_set_updated_at ON public.content_templates;
CREATE TRIGGER content_templates_set_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS task_instances_set_updated_at ON public.task_instances;
CREATE TRIGGER task_instances_set_updated_at
  BEFORE UPDATE ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS student_task_progress_set_updated_at ON public.student_task_progress;
CREATE TRIGGER student_task_progress_set_updated_at
  BEFORE UPDATE ON public.student_task_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.learning_task_staff_can_manage_section(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid) OR public.user_leads_or_assists_section(p_uid, p_section_id);
$$;

CREATE OR REPLACE FUNCTION public.learning_task_template_staff_can_read(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid) OR public.user_has_role(p_uid, 'teacher');
$$;

CREATE OR REPLACE FUNCTION public.learning_task_instance_visible_to_current_user(p_task_instance_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_instances ti
    JOIN public.section_enrollments e ON e.section_id = ti.section_id
    WHERE ti.id = p_task_instance_id
      AND (
        public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
        OR e.student_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
        )
      )
  );
$$;

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_task_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_templates_select_staff ON public.content_templates;
CREATE POLICY content_templates_select_staff ON public.content_templates
  FOR SELECT TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()));

DROP POLICY IF EXISTS content_templates_write_staff ON public.content_templates;
CREATE POLICY content_templates_write_staff ON public.content_templates
  FOR ALL TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()))
  WITH CHECK (public.learning_task_template_staff_can_read(auth.uid()) AND updated_by = auth.uid());

DROP POLICY IF EXISTS content_template_assets_select_staff ON public.content_template_assets;
CREATE POLICY content_template_assets_select_staff ON public.content_template_assets
  FOR SELECT TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()));

DROP POLICY IF EXISTS content_template_assets_write_staff ON public.content_template_assets;
CREATE POLICY content_template_assets_write_staff ON public.content_template_assets
  FOR ALL TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()))
  WITH CHECK (public.learning_task_template_staff_can_read(auth.uid()));

DROP POLICY IF EXISTS task_instances_select_scope ON public.task_instances;
CREATE POLICY task_instances_select_scope ON public.task_instances
  FOR SELECT TO authenticated
  USING (public.learning_task_instance_visible_to_current_user(id));

DROP POLICY IF EXISTS task_instances_write_staff ON public.task_instances;
CREATE POLICY task_instances_write_staff ON public.task_instances
  FOR ALL TO authenticated
  USING (public.learning_task_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.learning_task_staff_can_manage_section(auth.uid(), section_id) AND updated_by = auth.uid());

DROP POLICY IF EXISTS task_instance_assets_select_scope ON public.task_instance_assets;
CREATE POLICY task_instance_assets_select_scope ON public.task_instance_assets
  FOR SELECT TO authenticated
  USING (public.learning_task_instance_visible_to_current_user(task_instance_id));

DROP POLICY IF EXISTS task_instance_assets_write_staff ON public.task_instance_assets;
CREATE POLICY task_instance_assets_write_staff ON public.task_instance_assets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = task_instance_assets.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = task_instance_assets.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  );

DROP POLICY IF EXISTS student_task_progress_select_scope ON public.student_task_progress;
CREATE POLICY student_task_progress_select_scope ON public.student_task_progress
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.learning_task_instance_visible_to_current_user(task_instance_id)
  );

DROP POLICY IF EXISTS student_task_progress_student_update ON public.student_task_progress;
CREATE POLICY student_task_progress_student_update ON public.student_task_progress
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS student_task_progress_staff_insert ON public.student_task_progress;
CREATE POLICY student_task_progress_staff_insert ON public.student_task_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = student_task_progress.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'learning-task-assets',
  'learning-task-assets',
  FALSE,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']::text[];

DROP POLICY IF EXISTS learning_task_assets_staff_write ON storage.objects;
CREATE POLICY learning_task_assets_staff_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'learning-task-assets' AND public.learning_task_template_staff_can_read(auth.uid()))
  WITH CHECK (bucket_id = 'learning-task-assets' AND public.learning_task_template_staff_can_read(auth.uid()));

-- ========== 070_section_content_planning_assessments.sql ==========

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

-- ========== 071_content_templates_description.sql ==========

-- Add a short repository description to global content templates.
DO $$
BEGIN
  IF to_regclass('public.content_templates') IS NOT NULL THEN
    ALTER TABLE public.content_templates
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- ========== 072_content_template_blocks.sql ==========

-- Block-based authoring for global content templates.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_template_block_kind') THEN
    CREATE TYPE public.content_template_block_kind AS ENUM (
      'text',
      'file',
      'video_embed',
      'audio',
      'image',
      'pdf',
      'quiz',
      'external_link',
      'divider'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.content_templates') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS public.content_template_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id UUID NOT NULL REFERENCES public.content_templates (id) ON DELETE CASCADE,
      asset_id UUID NULL REFERENCES public.content_template_assets (id) ON DELETE SET NULL,
      kind public.content_template_block_kind NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS content_template_blocks_template_order_idx
      ON public.content_template_blocks (template_id, sort_order, created_at);

    DROP TRIGGER IF EXISTS content_template_blocks_set_updated_at ON public.content_template_blocks;
    CREATE TRIGGER content_template_blocks_set_updated_at
      BEFORE UPDATE ON public.content_template_blocks
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    ALTER TABLE public.content_template_blocks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS content_template_blocks_select_staff ON public.content_template_blocks;
    CREATE POLICY content_template_blocks_select_staff ON public.content_template_blocks
      FOR SELECT TO authenticated
      USING (public.learning_task_template_staff_can_read(auth.uid()));

    DROP POLICY IF EXISTS content_template_blocks_write_staff ON public.content_template_blocks;
    CREATE POLICY content_template_blocks_write_staff ON public.content_template_blocks
      FOR ALL TO authenticated
      USING (public.learning_task_template_staff_can_read(auth.uid()))
      WITH CHECK (public.learning_task_template_staff_can_read(auth.uid()));
  END IF;
END $$;

-- ========== 073_learning_task_assets_audio_mimes.sql ==========

-- Allow audio files in the learning content asset bucket.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'learning-task-assets') THEN
    UPDATE storage.buckets
    SET allowed_mime_types = ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/webm'
    ]::text[]
    WHERE id = 'learning-task-assets';
  END IF;
END $$;

-- ========== 074_learning_task_assets_office_mimes.sql ==========

-- Allow Microsoft Office files in the learning content asset bucket.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'learning-task-assets') THEN
    UPDATE storage.buckets
    SET allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/webp',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/webm'
    ]::text[]
    WHERE id = 'learning-task-assets';
  END IF;
END $$;

-- ========== 075_learning_routes_rename.sql ==========

-- Rename section content planning into Learning Routes.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_route_visibility') THEN
    CREATE TYPE public.learning_route_visibility AS ENUM ('global', 'section');
  END IF;
END $$;

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

ALTER TABLE public.learning_routes
  DROP CONSTRAINT IF EXISTS section_content_plans_section_uidx,
  ALTER COLUMN section_id DROP NOT NULL;

ALTER TABLE public.learning_routes
  ADD COLUMN IF NOT EXISTS visibility public.learning_route_visibility NOT NULL DEFAULT 'section';

UPDATE public.learning_routes
SET visibility = CASE WHEN section_id IS NULL THEN 'global'::public.learning_route_visibility ELSE 'section'::public.learning_route_visibility END;

ALTER TABLE public.learning_routes
  DROP CONSTRAINT IF EXISTS learning_routes_visibility_section_shape,
  ADD CONSTRAINT learning_routes_visibility_section_shape CHECK (
    (visibility = 'global' AND section_id IS NULL)
    OR (visibility = 'section' AND section_id IS NOT NULL)
  );

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
    FOREIGN KEY (content_template_id) REFERENCES public.content_templates (id) ON DELETE RESTRICT;

ALTER TABLE public.learning_assessments
  DROP CONSTRAINT IF EXISTS learning_assessments_scope_present,
  ADD CONSTRAINT learning_assessments_scope_present CHECK (
    section_id IS NOT NULL OR learning_route_step_id IS NOT NULL OR template_id IS NOT NULL
  );

DROP INDEX IF EXISTS planned_lessons_plan_order_idx;
CREATE INDEX IF NOT EXISTS learning_route_steps_route_order_idx
  ON public.learning_route_steps (learning_route_id, sort_order, created_at);

DROP TRIGGER IF EXISTS section_content_plans_set_updated_at ON public.learning_routes;
DROP TRIGGER IF EXISTS planned_lessons_set_updated_at ON public.learning_route_steps;
DROP TRIGGER IF EXISTS learning_routes_set_updated_at ON public.learning_routes;
CREATE TRIGGER learning_routes_set_updated_at BEFORE UPDATE ON public.learning_routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS learning_route_steps_set_updated_at ON public.learning_route_steps;
CREATE TRIGGER learning_route_steps_set_updated_at BEFORE UPDATE ON public.learning_route_steps
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
  SELECT EXISTS (
    SELECT 1
    FROM public.learning_routes r
    WHERE r.id = p_route_id
      AND (
        (r.visibility = 'global' AND public.learning_route_staff_can_manage_global(p_uid))
        OR (r.visibility = 'section' AND public.learning_route_staff_can_manage_section(p_uid, r.section_id))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.learning_route_visible_to_current_user(p_route_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.learning_routes r
    WHERE r.id = p_route_id
      AND (
        (r.visibility = 'global' AND public.learning_route_staff_can_manage_global(auth.uid()))
        OR (
          r.visibility = 'section'
          AND (
            public.learning_route_staff_can_manage_section(auth.uid(), r.section_id)
            OR EXISTS (
              SELECT 1
              FROM public.section_enrollments e
              WHERE e.section_id = r.section_id
                AND (
                  e.student_id = auth.uid()
                  OR EXISTS (
                    SELECT 1 FROM public.tutor_student_rel ts
                    WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
                  )
                )
            )
          )
        )
      )
  );
$$;

ALTER TABLE public.learning_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_route_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_lesson_route_step_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_content_plans_select_scope ON public.learning_routes;
DROP POLICY IF EXISTS section_content_plans_write_staff ON public.learning_routes;
DROP POLICY IF EXISTS learning_routes_select_scope ON public.learning_routes;
DROP POLICY IF EXISTS learning_routes_write_staff ON public.learning_routes;
CREATE POLICY learning_routes_select_scope ON public.learning_routes FOR SELECT TO authenticated
  USING (public.learning_route_visible_to_current_user(id));
CREATE POLICY learning_routes_write_staff ON public.learning_routes FOR ALL TO authenticated
  USING (
    (visibility = 'global' AND public.learning_route_staff_can_manage_global(auth.uid()))
    OR (visibility = 'section' AND public.learning_route_staff_can_manage_section(auth.uid(), section_id))
  )
  WITH CHECK (
    updated_by = auth.uid()
    AND (
      (visibility = 'global' AND public.learning_route_staff_can_manage_global(auth.uid()))
      OR (visibility = 'section' AND public.learning_route_staff_can_manage_section(auth.uid(), section_id))
    )
  );

DROP POLICY IF EXISTS planned_lessons_select_scope ON public.learning_route_steps;
DROP POLICY IF EXISTS planned_lessons_write_staff ON public.learning_route_steps;
DROP POLICY IF EXISTS learning_route_steps_select_scope ON public.learning_route_steps;
DROP POLICY IF EXISTS learning_route_steps_write_staff ON public.learning_route_steps;
CREATE POLICY learning_route_steps_select_scope ON public.learning_route_steps FOR SELECT TO authenticated
  USING (public.learning_route_visible_to_current_user(learning_route_id));
CREATE POLICY learning_route_steps_write_staff ON public.learning_route_steps FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_route(auth.uid(), learning_route_id))
  WITH CHECK (updated_by = auth.uid() AND public.learning_route_staff_can_manage_route(auth.uid(), learning_route_id));

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