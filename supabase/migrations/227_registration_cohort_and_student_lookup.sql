-- Configurable public registration cohort, expanded student/tutor DNI prefill lookup,
-- and the public register section picker (off unless staff opt in).
-- Additive migration per 21-migrations-production-no-data-destruction.mdc.

BEGIN;

INSERT INTO public.site_settings (key, value)
VALUES ('register_show_all_sections', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;

CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'inscriptions_enabled',
      'initial_site_setup',
      'billing_currency',
      'bank_transfer_instructions',
      'billing_model',
      'public_cta_mode',
      'credit_paid_trial_on_enroll',
      'allow_parent_partial_section_payments',
      'register_show_all_sections'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard, billing, transfer instructions, billing model, public CTA, family checkout policy, and register section picker.';

CREATE OR REPLACE FUNCTION public.resolve_public_registration_cohort_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw jsonb;
  v_text text;
  v_candidate uuid;
  v_resolved uuid;
BEGIN
  SELECT value INTO v_raw
  FROM public.site_settings
  WHERE key = 'registration_cohort_id'
  LIMIT 1;

  IF v_raw IS NOT NULL THEN
    IF jsonb_typeof(v_raw) = 'string' THEN
      v_text := trim(both FROM (v_raw #>> '{}'));
    ELSIF jsonb_typeof(v_raw) = 'object' THEN
      v_text := trim(both FROM COALESCE(v_raw ->> 'cohortId', ''));
    END IF;

    IF v_text IS NOT NULL AND v_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      v_candidate := v_text::uuid;
      SELECT c.id INTO v_resolved
      FROM public.academic_cohorts c
      WHERE c.id = v_candidate
        AND c.archived_at IS NULL
      LIMIT 1;

      IF v_resolved IS NOT NULL THEN
        RETURN v_resolved;
      END IF;
    END IF;
  END IF;

  SELECT c.id INTO v_resolved
  FROM public.academic_cohorts c
  WHERE c.is_current = true
    AND c.archived_at IS NULL
  LIMIT 1;

  RETURN v_resolved;
END;
$$;

COMMENT ON FUNCTION public.resolve_public_registration_cohort_id() IS
  'Returns site_settings.registration_cohort_id when it points to a non-archived cohort, else the current non-archived cohort id.';

REVOKE ALL ON FUNCTION public.resolve_public_registration_cohort_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_registration_cohort_id() TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.list_registration_section_picker_options();
DROP FUNCTION IF EXISTS public.list_registration_section_picker_options(uuid);

CREATE OR REPLACE FUNCTION public.list_registration_section_picker_options(
  p_cohort_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  label text,
  schedule_slots jsonb,
  has_open_seat boolean,
  offers_trial boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         c.name || ' — ' || s.name AS label,
         COALESCE(s.schedule_slots, '[]'::jsonb) AS schedule_slots,
         (
           s.max_students IS NULL
           OR (
             (
               SELECT count(*)
               FROM public.section_enrollments se
               WHERE se.section_id = s.id
                 AND se.status = 'active'
             ) + (
               SELECT count(*)
               FROM public.registration_trial_seats ts
               WHERE ts.section_id = s.id
                 AND ts.status IN ('booked', 'attended')
             )
           ) < s.max_students
         ) AS has_open_seat,
         COALESCE(s.offers_trial, c.offers_trial) AS offers_trial
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE c.id = COALESCE(p_cohort_id, public.resolve_public_registration_cohort_id())
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
  ORDER BY c.name, s.name;
$$;

COMMENT ON FUNCTION public.list_registration_section_picker_options(uuid) IS
  'Sections for the public register picker (or an explicit cohort when provided), including full groups.';

REVOKE ALL ON FUNCTION public.list_registration_section_picker_options(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_registration_section_picker_options(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_picker_options(uuid) TO authenticated;

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
  WHERE c.id = public.resolve_public_registration_cohort_id()
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
    AND (
      s.max_students IS NULL
      OR (
        (
          SELECT count(*)
          FROM public.section_enrollments se
          WHERE se.section_id = s.id
            AND se.status = 'active'
        ) + (
          SELECT count(*)
          FROM public.registration_trial_seats ts
          WHERE ts.section_id = s.id
            AND ts.status IN ('booked', 'attended')
        )
      ) < s.max_students
    )
  ORDER BY c.name, s.name;
$$;

REVOKE ALL ON FUNCTION public.list_registration_section_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO authenticated;

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
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
    AND (
      c.id = public.resolve_public_registration_cohort_id()
      OR c.is_current = true
      OR public.is_admin(auth.uid())
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.registration_public_section_label(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_section_label(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_section_label(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.registration_public_section_has_open_seat(p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
    WHERE s.id = p_section_id
      AND c.archived_at IS NULL
      AND s.archived_at IS NULL
      AND (
        c.id = public.resolve_public_registration_cohort_id()
        OR c.is_current = true
        OR public.is_admin(auth.uid())
      )
      AND (
        s.max_students IS NULL
        OR (
          (
            SELECT count(*) FROM public.section_enrollments se
            WHERE se.section_id = s.id AND se.status = 'active'
          ) + (
            SELECT count(*) FROM public.registration_trial_seats ts
            WHERE ts.section_id = s.id AND ts.status IN ('booked', 'attended')
          )
        ) < s.max_students
      )
  );
$$;

REVOKE ALL ON FUNCTION public.registration_public_section_has_open_seat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_section_has_open_seat(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_section_has_open_seat(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.lookup_registration_student(text);

CREATE OR REPLACE FUNCTION public.lookup_registration_student(p_dni text)
RETURNS TABLE (
  found boolean,
  first_name text,
  last_name text,
  birth_date text,
  phone text,
  email text,
  tutor_name text,
  tutor_dni text,
  tutor_email text,
  tutor_phone text,
  tutor_relationship text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_student_id uuid;
  v_first text;
  v_last text;
  v_birth text;
  v_phone text;
  v_email text;
  v_role public.user_role;
  v_tutor_id uuid;
  v_tutor_rel text;
  v_tutor_first text;
  v_tutor_last text;
  v_tutor_name text;
  v_tutor_dni text;
  v_tutor_phone text;
  v_tutor_email text;
BEGIN
  v_norm := lower(trim(both FROM replace(replace(COALESCE(p_dni, ''), '.', ''), ' ', '')));
  IF v_norm = '' THEN
    RETURN QUERY SELECT
      false,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT
    p.id,
    p.first_name,
    p.last_name,
    CASE WHEN p.birth_date IS NOT NULL THEN to_char(p.birth_date, 'YYYY-MM-DD') ELSE NULL END,
    NULLIF(trim(both FROM COALESCE(p.phone, '')), '—'),
    p.role
  INTO v_student_id, v_first, v_last, v_birth, v_phone, v_role
  FROM public.profiles p
  WHERE lower(trim(both FROM replace(replace(COALESCE(p.dni_or_passport, ''), '.', ''), ' ', ''))) = v_norm
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'student' OR v_student_id IS NULL THEN
    RETURN QUERY SELECT
      false,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_student_id
  LIMIT 1;

  IF v_email IS NOT NULL AND (
    v_email LIKE '%@students.goldenenglish.local'
    OR v_email LIKE '%@parents.%'
  ) THEN
    v_email := NULL;
  END IF;

  SELECT r.tutor_id, r.relationship
  INTO v_tutor_id, v_tutor_rel
  FROM public.tutor_student_rel r
  WHERE r.student_id = v_student_id
  ORDER BY r.tutor_id
  LIMIT 1;

  IF v_tutor_id IS NOT NULL THEN
    SELECT
      tp.first_name,
      tp.last_name,
      tp.dni_or_passport,
      NULLIF(trim(both FROM COALESCE(tp.phone, '')), '—')
    INTO v_tutor_first, v_tutor_last, v_tutor_dni, v_tutor_phone
    FROM public.profiles tp
    WHERE tp.id = v_tutor_id
    LIMIT 1;

    v_tutor_name := NULLIF(trim(both FROM COALESCE(v_tutor_first, '') || ' ' || COALESCE(v_tutor_last, '')), '');

    SELECT tu.email INTO v_tutor_email
    FROM auth.users tu
    WHERE tu.id = v_tutor_id
    LIMIT 1;

    IF v_tutor_email IS NOT NULL AND (
      v_tutor_email LIKE '%@students.goldenenglish.local'
      OR v_tutor_email LIKE '%@parents.%'
    ) THEN
      v_tutor_email := NULL;
    END IF;
  END IF;

  RETURN QUERY SELECT
    true,
    v_first,
    v_last,
    v_birth,
    v_phone,
    v_email,
    v_tutor_name,
    v_tutor_dni,
    v_tutor_email,
    v_tutor_phone,
    v_tutor_rel;
END;
$$;

COMMENT ON FUNCTION public.lookup_registration_student(text) IS
  'Registration lookup by document: student and primary tutor prefill fields when role=student, else found=false.';

REVOKE ALL ON FUNCTION public.lookup_registration_student(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_registration_student(text) TO anon, authenticated;

COMMIT;
