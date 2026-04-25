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
