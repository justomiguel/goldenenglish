BEGIN;

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

  SELECT COUNT(*)::int
  INTO v_occupied_count
  FROM public.event_attendees ea
  WHERE ea.event_id = p_event_id
    AND ea.status IN ('confirmed', 'pending_payment');

  IF v_occupied_count >= v_event.capacity THEN
    v_target_status := 'waitlist';
  ELSE
    IF v_event.price IS NULL OR v_event.price = 0 THEN
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

  v_price := COALESCE(v_event.price, 0);
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
  JSONB
) TO anon, authenticated;

COMMIT;
