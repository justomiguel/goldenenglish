-- 184_enroll_event_attendee_packages.sql
--
-- Packages and multi-ticket purchases in the enroll RPC.
--
-- Two things change. An event with at least one active ticket package is "in
-- package mode": the seat price comes from the chosen package and the residency
-- tiers stop deciding the amount (they are still recorded on the titular). And a
-- registration may now buy several seats — one titular row plus one row per
-- companion, all pointing at the titular through primary_attendee_id.
--
-- The payment still stays on the titular for the full amount, so event_payments,
-- both gateways and the whole review panel keep working untouched. Everything
-- that decides money or a seat count is computed here; the client's total is
-- decoration.
--
-- Body is the one from 158 (deferred payment lifecycle) with the package, seat
-- and companion logic layered on. The deferred-payment contract is unchanged:
-- this function still creates no event_payments row.

DROP FUNCTION IF EXISTS public.enroll_event_attendee(
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
);

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
  p_field_values JSONB DEFAULT '[]'::jsonb,
  p_ticket_package_id UUID DEFAULT NULL,
  p_companions JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  attendee_id UUID,
  attendee_status public.event_attendee_status,
  payment_required BOOLEAN,
  payment_id UUID,
  result_code TEXT,
  seats INT,
  total_amount NUMERIC(12, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_attendee_id UUID;
  v_occupied_count INT;
  v_legal_age_majority INT := 18;
  v_age INT;
  v_is_minor BOOLEAN := false;
  v_target_status public.event_attendee_status;
  v_price NUMERIC(12, 2);
  v_local_price NUMERIC(12, 2);
  v_non_local_price NUMERIC(12, 2);
  v_has_packages BOOLEAN := false;
  v_package public.event_ticket_packages%ROWTYPE;
  v_seats INT := 1;
  v_total NUMERIC(12, 2);
  v_remaining INT;
  v_package_remaining INT;
  v_package_occupied INT;
  v_companion JSONB;
  v_companion_id UUID;
BEGIN
  SELECT *
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF v_event.id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_not_found', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF v_event.archived_at IS NOT NULL OR v_event.status <> 'published' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_not_open', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  -- dni_required still applies to the titular only; a companion may have none.
  IF p_dni_or_passport IS NULL OR btrim(p_dni_or_passport) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'dni_required', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF p_first_name IS NULL OR btrim(p_first_name) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'first_name_required', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF p_last_name IS NULL OR btrim(p_last_name) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'last_name_required', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'email_required', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF v_event.private_to_section THEN
    IF p_user_id IS NULL OR v_event.section_id IS NULL THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_section_membership_required', 0, NULL::numeric(12,2);
      RETURN;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.section_enrollments se
      WHERE se.section_id = v_event.section_id
        AND se.student_id = p_user_id
        AND se.status = 'active'
    ) THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_section_membership_required', 0, NULL::numeric(12,2);
      RETURN;
    END IF;
  END IF;

  -- Scoped to titulars: companions are excluded from the per-event document
  -- uniqueness, matching the partial unique index added in migration 183.
  IF EXISTS (
    SELECT 1
    FROM public.event_attendees ea
    WHERE ea.event_id = p_event_id
      AND ea.primary_attendee_id IS NULL
      AND lower(ea.dni_or_passport) = lower(p_dni_or_passport)
  ) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'duplicate_dni', 0, NULL::numeric(12,2);
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

  -- The titular is who is responsible for the purchase, so the guardian block is
  -- asked once, never once per companion.
  IF v_is_minor THEN
    IF (
      (p_tutor_id IS NULL)
      AND (p_tutor_first_name IS NULL OR btrim(p_tutor_first_name) = '')
    ) THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'event_tutor_required', 0, NULL::numeric(12,2);
      RETURN;
    END IF;
  END IF;

  -- Package mode is inferred from having at least one active package (D2).
  v_has_packages := EXISTS (
    SELECT 1
    FROM public.event_ticket_packages tp
    WHERE tp.event_id = p_event_id
      AND tp.archived_at IS NULL
  );

  IF p_ticket_package_id IS NOT NULL AND NOT v_has_packages THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'package_not_allowed', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF v_has_packages AND p_ticket_package_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'package_required', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  IF p_ticket_package_id IS NOT NULL THEN
    SELECT *
    INTO v_package
    FROM public.event_ticket_packages tp
    WHERE tp.id = p_ticket_package_id
      AND tp.event_id = p_event_id
      AND tp.archived_at IS NULL;

    IF v_package.id IS NULL THEN
      RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'package_not_found', 0, NULL::numeric(12,2);
      RETURN;
    END IF;
  END IF;

  -- Seats: the titular plus one per companion.
  IF jsonb_typeof(p_companions) = 'array' THEN
    v_seats := 1 + jsonb_array_length(p_companions);
  ELSE
    v_seats := 1;
  END IF;

  IF v_seats > 1 AND NOT COALESCE(v_event.allow_multiple_tickets, false) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'multiple_tickets_not_allowed', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  -- The maximum is never null while multiple tickets are allowed (migration 183's
  -- CHECK), so there is no unlimited branch to fall through to.
  IF v_seats > 1 AND v_seats > COALESCE(v_event.max_tickets_per_registration, 1) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'too_many_tickets', COALESCE(v_event.max_tickets_per_registration, 1), NULL::numeric(12,2);
    RETURN;
  END IF;

  IF v_seats > 1 AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_companions) c
    WHERE COALESCE(btrim(c->>'first_name'), '') = ''
       OR COALESCE(btrim(c->>'last_name'), '') = ''
  ) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'companion_name_required', 0, NULL::numeric(12,2);
    RETURN;
  END IF;

  -- Price: the package wins in package mode; otherwise the residency resolution
  -- is byte-for-byte the one that has always run here.
  IF v_package.id IS NOT NULL THEN
    v_price := v_package.price;
  ELSE
    v_local_price := COALESCE(v_event.price_local, v_event.price, 0);
    v_non_local_price := COALESCE(v_event.price_non_local, v_local_price, 0);
    v_price := CASE
      WHEN COALESCE(p_is_local_resident, true) THEN v_local_price
      ELSE v_non_local_price
    END;
  END IF;

  v_total := COALESCE(v_price, 0) * v_seats;

  -- Availability. Waitlist rows deliberately do not occupy a seat — that is what
  -- makes a waitlist a waitlist — so the count is unchanged from before.
  SELECT COUNT(*)::int
  INTO v_occupied_count
  FROM public.event_attendees ea
  WHERE ea.event_id = p_event_id
    AND ea.status IN ('confirmed', 'pending_payment');

  v_remaining := v_event.capacity - v_occupied_count;

  IF v_package.id IS NOT NULL AND v_package.capacity IS NOT NULL THEN
    SELECT COUNT(*)::int
    INTO v_package_occupied
    FROM public.event_attendees ea
    WHERE ea.event_id = p_event_id
      AND ea.ticket_package_id = v_package.id
      AND ea.status IN ('confirmed', 'pending_payment');

    v_package_remaining := v_package.capacity - v_package_occupied;
    IF v_package_remaining < v_remaining THEN
      v_remaining := v_package_remaining;
    END IF;
  END IF;

  IF v_remaining <= 0 THEN
    -- Nothing left at all: the whole group waits together (D6).
    v_target_status := 'waitlist';
  ELSIF v_remaining < v_seats THEN
    -- Some room but not enough: refuse and say how much is left, rather than
    -- splitting a family across a confirmation and a waitlist.
    RETURN QUERY SELECT NULL::uuid, NULL::public.event_attendee_status, false, NULL::uuid, 'insufficient_seats', v_remaining, v_total;
    RETURN;
  ELSE
    IF v_total IS NULL OR v_total = 0 THEN
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
    tutor_relationship,
    ticket_package_id
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
    NULLIF(btrim(COALESCE(p_tutor_relationship, '')), ''),
    p_ticket_package_id
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

  -- Companion seats. Same status and same package as the titular, so the whole
  -- purchase moves as one. Optional identity fields are written only where the
  -- event asks for them.
  IF v_seats > 1 THEN
    FOR v_companion IN SELECT * FROM jsonb_array_elements(p_companions)
    LOOP
      INSERT INTO public.event_attendees (
        event_id,
        first_name,
        last_name,
        dni_or_passport,
        email,
        birth_date,
        status,
        source,
        is_local_resident,
        ticket_package_id,
        primary_attendee_id
      ) VALUES (
        p_event_id,
        btrim(v_companion->>'first_name'),
        btrim(v_companion->>'last_name'),
        CASE
          WHEN COALESCE(v_event.companion_collect_dni, false)
          THEN NULLIF(btrim(COALESCE(v_companion->>'dni_or_passport', '')), '')
          ELSE NULL
        END,
        CASE
          WHEN COALESCE(v_event.companion_collect_email, false)
          THEN NULLIF(lower(btrim(COALESCE(v_companion->>'email', ''))), '')
          ELSE NULL
        END,
        CASE
          WHEN COALESCE(v_event.companion_collect_birth_date, false)
          THEN NULLIF(btrim(COALESCE(v_companion->>'birth_date', '')), '')::date
          ELSE NULL
        END,
        v_target_status,
        COALESCE(NULLIF(btrim(COALESCE(p_source, '')), ''), 'public'),
        COALESCE(p_is_local_resident, true),
        p_ticket_package_id,
        v_attendee_id
      )
      RETURNING id INTO v_companion_id;

      -- Only questions the event marked as per-companion are stored here.
      IF jsonb_typeof(v_companion->'field_values') = 'array' THEN
        INSERT INTO public.event_attendee_field_values (
          attendee_id,
          field_id,
          value_text,
          value_number,
          value_date,
          file_storage_path
        )
        SELECT
          v_companion_id,
          (raw_item->>'field_id')::uuid,
          NULLIF(raw_item->>'value_text', ''),
          (raw_item->>'value_number')::numeric,
          (raw_item->>'value_date')::date,
          NULLIF(raw_item->>'file_storage_path', '')
        FROM jsonb_array_elements(v_companion->'field_values') raw_item
        WHERE (raw_item->>'field_id') IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.event_form_fields f
            WHERE f.id = (raw_item->>'field_id')::uuid
              AND f.event_id = p_event_id
              AND f.archived_at IS NULL
              AND f.collect_for_companions = true
          );
      END IF;
    END LOOP;
  END IF;

  -- Deferred payment lifecycle: no event_payments row is created here. Gateway-confirmed
  -- payments are materialized as `approved` by the finalize flow; transfer payments are
  -- materialized as `pending` only when a receipt is uploaded. The payment belongs to the
  -- titular and carries the full v_total, so a purchase never yields two payment rows.

  RETURN QUERY
    SELECT
      v_attendee_id,
      v_target_status,
      (v_target_status = 'pending_payment'),
      NULL::uuid,
      CASE
        WHEN v_target_status = 'waitlist' THEN 'waitlist'
        WHEN v_target_status = 'pending_payment' THEN 'payment_pending'
        ELSE 'confirmed'
      END,
      v_seats,
      v_total;
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
  JSONB,
  UUID,
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
  JSONB,
  UUID,
  JSONB
) TO anon, authenticated;
