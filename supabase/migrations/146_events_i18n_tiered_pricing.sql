BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_local NUMERIC(12, 2) NULL
    CHECK (price_local IS NULL OR price_local >= 0),
  ADD COLUMN IF NOT EXISTS price_non_local NUMERIC(12, 2) NULL
    CHECK (price_non_local IS NULL OR price_non_local >= 0);

UPDATE public.events
SET
  price_local = COALESCE(price_local, price),
  price_non_local = COALESCE(price_non_local, price)
WHERE price IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.event_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('es', 'en', 'pt')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_translations_event_locale_unique UNIQUE (event_id, locale)
);

CREATE INDEX IF NOT EXISTS event_translations_event_locale_idx
  ON public.event_translations (event_id, locale);

DROP TRIGGER IF EXISTS event_translations_set_updated_at ON public.event_translations;
CREATE TRIGGER event_translations_set_updated_at
  BEFORE UPDATE ON public.event_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.event_translations (event_id, locale, title, description, location)
SELECT e.id, e.default_locale, e.title, e.description, e.location
FROM public.events e
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_translations t
  WHERE t.event_id = e.id
    AND t.locale = e.default_locale
);

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS is_local_resident BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.event_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_translations_select_public_or_admin ON public.event_translations;
CREATE POLICY event_translations_select_public_or_admin ON public.event_translations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_translations.event_id
        AND (
          (e.status = 'published' AND e.archived_at IS NULL)
          OR public.is_admin(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS event_translations_modify_admin ON public.event_translations;
CREATE POLICY event_translations_modify_admin ON public.event_translations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.enroll_event_attendee(
  p_event_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_dni_or_passport TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_tutor_id UUID DEFAULT NULL,
  p_tutor_first_name TEXT DEFAULT NULL,
  p_tutor_last_name TEXT DEFAULT NULL,
  p_tutor_dni_or_passport TEXT DEFAULT NULL,
  p_tutor_email TEXT DEFAULT NULL,
  p_tutor_phone TEXT DEFAULT NULL,
  p_tutor_relationship TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'public',
  p_is_local_resident BOOLEAN DEFAULT true,
  p_field_values JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  attendee_id UUID,
  attendee_status public.event_attendee_status,
  payment_required BOOLEAN,
  payment_id UUID,
  result_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_attendee_id UUID;
  v_payment_id UUID;
  v_occupied_count INT;
  v_legal_age_majority INT := 18;
  v_age INT;
  v_is_minor BOOLEAN := false;
  v_target_status public.event_attendee_status;
  v_price NUMERIC(12, 2);
  v_local_price NUMERIC(12, 2);
  v_non_local_price NUMERIC(12, 2);
BEGIN
  SELECT *
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF v_event.id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_not_found';
    RETURN;
  END IF;

  IF v_event.archived_at IS NOT NULL OR v_event.status <> 'published' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_not_open';
    RETURN;
  END IF;

  IF p_dni_or_passport IS NULL OR btrim(p_dni_or_passport) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'dni_required';
    RETURN;
  END IF;

  IF p_first_name IS NULL OR btrim(p_first_name) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'first_name_required';
    RETURN;
  END IF;

  IF p_last_name IS NULL OR btrim(p_last_name) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'last_name_required';
    RETURN;
  END IF;

  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'email_required';
    RETURN;
  END IF;

  IF v_event.private_to_section THEN
    IF p_user_id IS NULL OR v_event.section_id IS NULL THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_section_membership_required';
      RETURN;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.section_enrollments se
      WHERE se.section_id = v_event.section_id
        AND se.student_id = p_user_id
        AND se.status = 'active'
    ) THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_section_membership_required';
      RETURN;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_attendees ea
    WHERE ea.event_id = p_event_id
      AND lower(ea.dni_or_passport) = lower(p_dni_or_passport)
  ) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'duplicate_dni';
    RETURN;
  END IF;

  SELECT COALESCE((value->>'value')::int, 18)
  INTO v_legal_age_majority
  FROM public.site_settings
  WHERE key = 'legal_age_majority';

  IF p_birth_date IS NOT NULL THEN
    v_age := EXTRACT(YEAR FROM age(now()::date, p_birth_date))::int;
    v_is_minor := v_age < v_legal_age_majority;
  END IF;

  IF v_is_minor THEN
    IF (
      (p_tutor_id IS NULL)
      AND (p_tutor_first_name IS NULL OR btrim(p_tutor_first_name) = '')
    ) THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_tutor_required';
      RETURN;
    END IF;
  END IF;

  v_local_price := COALESCE(v_event.price_local, v_event.price, 0);
  v_non_local_price := COALESCE(v_event.price_non_local, v_local_price, 0);
  v_price := CASE
    WHEN COALESCE(p_is_local_resident, true) THEN v_local_price
    ELSE v_non_local_price
  END;

  SELECT COUNT(*)::int
  INTO v_occupied_count
  FROM public.event_attendees ea
  WHERE ea.event_id = p_event_id
    AND ea.status IN ('confirmed', 'pending_payment');

  IF v_occupied_count >= v_event.capacity THEN
    v_target_status := 'waitlist';
  ELSE
    IF v_price IS NULL OR v_price = 0 THEN
      v_target_status := 'confirmed';
    ELSE
      v_target_status := 'pending_payment';
    END IF;
  END IF;

  INSERT INTO public.event_attendees (
    event_id,
    user_id,
    tutor_id,
    first_name,
    last_name,
    dni_or_passport,
    email,
    phone,
    birth_date,
    status,
    source,
    is_local_resident,
    tutor_first_name,
    tutor_last_name,
    tutor_dni_or_passport,
    tutor_email,
    tutor_phone,
    tutor_relationship
  ) VALUES (
    p_event_id,
    p_user_id,
    p_tutor_id,
    btrim(p_first_name),
    btrim(p_last_name),
    btrim(p_dni_or_passport),
    lower(btrim(p_email)),
    NULLIF(btrim(COALESCE(p_phone, '')), ''),
    p_birth_date,
    v_target_status,
    COALESCE(NULLIF(btrim(COALESCE(p_source, '')), ''), 'public'),
    COALESCE(p_is_local_resident, true),
    NULLIF(btrim(COALESCE(p_tutor_first_name, '')), ''),
    NULLIF(btrim(COALESCE(p_tutor_last_name, '')), ''),
    NULLIF(btrim(COALESCE(p_tutor_dni_or_passport, '')), ''),
    NULLIF(lower(btrim(COALESCE(p_tutor_email, ''))), ''),
    NULLIF(btrim(COALESCE(p_tutor_phone, '')), ''),
    NULLIF(btrim(COALESCE(p_tutor_relationship, '')), '')
  )
  RETURNING id INTO v_attendee_id;

  IF jsonb_typeof(p_field_values) = 'array' THEN
    INSERT INTO public.event_attendee_field_values (
      attendee_id,
      field_id,
      value_text,
      value_number,
      value_date,
      file_storage_path
    )
    SELECT
      v_attendee_id,
      (raw_item->>'field_id')::uuid,
      NULLIF(raw_item->>'value_text', ''),
      (raw_item->>'value_number')::numeric,
      (raw_item->>'value_date')::date,
      NULLIF(raw_item->>'file_storage_path', '')
    FROM jsonb_array_elements(p_field_values) raw_item
    WHERE (raw_item->>'field_id') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.event_form_fields f
        WHERE f.id = (raw_item->>'field_id')::uuid
          AND f.event_id = p_event_id
          AND f.archived_at IS NULL
      );
  END IF;

  IF v_target_status = 'pending_payment' AND v_price > 0 THEN
    INSERT INTO public.event_payments (event_attendee_id, amount, currency, status)
    VALUES (v_attendee_id, v_price, v_event.currency, 'pending')
    RETURNING id INTO v_payment_id;
  END IF;

  RETURN QUERY
    SELECT
      v_attendee_id,
      v_target_status,
      (v_target_status = 'pending_payment'),
      v_payment_id,
      CASE
        WHEN v_target_status = 'waitlist' THEN 'waitlist'
        WHEN v_target_status = 'pending_payment' THEN 'payment_pending'
        ELSE 'confirmed'
      END;
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_event_attendee(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  DATE,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BOOLEAN,
  JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.enroll_event_attendee(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  DATE,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BOOLEAN,
  JSONB
) TO anon, authenticated;

COMMENT ON TABLE public.event_translations IS
  'Per-locale title, description, and location for public event pages.';
COMMENT ON COLUMN public.events.price_local IS
  'Registration price for local residents; mirrors legacy price when unset.';
COMMENT ON COLUMN public.events.price_non_local IS
  'Registration price for non-local residents; falls back to price_local when unset.';

COMMIT;
