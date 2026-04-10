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
