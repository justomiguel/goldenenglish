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
