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
