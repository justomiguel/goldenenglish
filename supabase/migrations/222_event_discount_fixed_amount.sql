-- A discount code is either a percent or a fixed amount on N tickets.

ALTER TABLE public.event_discount_codes
  ALTER COLUMN discount_percent DROP NOT NULL;

ALTER TABLE public.event_discount_code_redemptions
  ALTER COLUMN discount_percent DROP NOT NULL;

ALTER TABLE public.event_discount_codes
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS ticket_count INT;

ALTER TABLE public.event_discount_code_redemptions
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS ticket_count INT;

ALTER TABLE public.event_discount_codes
  DROP CONSTRAINT IF EXISTS event_discount_codes_percent;

ALTER TABLE public.event_discount_code_redemptions
  DROP CONSTRAINT IF EXISTS event_discount_code_redemptions_percent;

ALTER TABLE public.event_discount_codes
  DROP CONSTRAINT IF EXISTS event_discount_codes_mode;

ALTER TABLE public.event_discount_codes
  ADD CONSTRAINT event_discount_codes_mode CHECK (
    (
      discount_percent BETWEEN 1 AND 100
      AND discount_amount IS NULL
      AND ticket_count IS NULL
    )
    OR (
      discount_percent IS NULL
      AND discount_amount > 0
      AND discount_amount <= 99999999.99
      AND ticket_count BETWEEN 1 AND 10000
    )
  );

ALTER TABLE public.event_discount_code_redemptions
  DROP CONSTRAINT IF EXISTS event_discount_code_redemptions_mode;

ALTER TABLE public.event_discount_code_redemptions
  ADD CONSTRAINT event_discount_code_redemptions_mode CHECK (
    (
      discount_percent BETWEEN 1 AND 100
      AND discount_amount IS NULL
      AND ticket_count IS NULL
    )
    OR (
      discount_percent IS NULL
      AND discount_amount > 0
      AND discount_amount <= 99999999.99
      AND ticket_count BETWEEN 1 AND 10000
    )
  );

CREATE OR REPLACE FUNCTION public.enroll_event_attendee_with_discount(
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
  p_companions JSONB DEFAULT '[]'::jsonb,
  p_discount_code TEXT DEFAULT NULL,
  p_flow_unit_price NUMERIC DEFAULT NULL
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
  v_row RECORD;
  v_code public.event_discount_codes%ROWTYPE;
  v_normalized TEXT;
  v_occupied INT;
  v_currency TEXT;
  v_base NUMERIC(12, 2);
  v_discounted NUMERIC(12, 2);
  v_status public.event_attendee_status;
  v_result TEXT;
  v_seats INT;
  v_unit NUMERIC;
  v_digits INT;
  v_covered INT;
  v_new_unit NUMERIC;
BEGIN
  v_normalized := lower(btrim(coalesce(p_discount_code, '')));

  SELECT * INTO v_code
  FROM public.event_discount_codes
  WHERE event_id = p_event_id AND code_normalized = v_normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::uuid,
      NULL::public.event_attendee_status,
      false,
      NULL::uuid,
      'invalid_code'::text,
      0,
      NULL::numeric(12, 2);
    RETURN;
  END IF;

  SELECT count(*)::int INTO v_occupied
  FROM public.event_discount_code_redemptions
  WHERE code_id = v_code.id AND status IN ('reserved', 'consumed');

  IF v_code.max_uses IS NOT NULL AND v_occupied >= v_code.max_uses THEN
    RETURN QUERY SELECT
      NULL::uuid,
      NULL::public.event_attendee_status,
      false,
      NULL::uuid,
      'no_uses'::text,
      0,
      NULL::numeric(12, 2);
    RETURN;
  END IF;

  SELECT * INTO v_row
  FROM public.enroll_event_attendee(
    p_event_id,
    p_user_id,
    p_first_name,
    p_last_name,
    p_dni_or_passport,
    p_email,
    p_phone,
    p_birth_date,
    p_tutor_id,
    p_tutor_first_name,
    p_tutor_last_name,
    p_tutor_dni_or_passport,
    p_tutor_email,
    p_tutor_phone,
    p_tutor_relationship,
    p_source,
    p_is_local_resident,
    p_field_values,
    p_ticket_package_id,
    p_companions
  );

  IF v_row.attendee_id IS NULL OR v_row.result_code NOT IN ('confirmed', 'payment_pending', 'waitlist') THEN
    RETURN QUERY SELECT
      v_row.attendee_id,
      v_row.attendee_status,
      v_row.payment_required,
      v_row.payment_id,
      v_row.result_code,
      v_row.seats,
      v_row.total_amount;
    RETURN;
  END IF;

  SELECT e.currency INTO v_currency FROM public.events e WHERE e.id = p_event_id;
  v_seats := GREATEST(coalesce(v_row.seats, 1), 1);
  v_digits := CASE WHEN upper(coalesce(v_currency, '')) IN ('CLP', 'ARS') THEN 0 ELSE 2 END;

  IF v_code.discount_amount IS NOT NULL AND v_code.ticket_count IS NOT NULL THEN
    v_unit := CASE
      WHEN p_flow_unit_price IS NOT NULL THEN p_flow_unit_price
      ELSE coalesce(v_row.total_amount, 0) / v_seats
    END;
    v_covered := LEAST(v_seats, v_code.ticket_count);
    v_new_unit := round(GREATEST(0, round(v_unit, v_digits) - v_code.discount_amount), v_digits);
    v_discounted := round(
      (v_covered * v_new_unit) + ((v_seats - v_covered) * round(v_unit, v_digits)),
      v_digits
    );
  ELSE
    v_base := CASE
      WHEN p_flow_unit_price IS NOT NULL THEN round(p_flow_unit_price * v_seats, 2)
      ELSE coalesce(v_row.total_amount, 0)
    END;
    v_discounted := round(v_base * (1 - (v_code.discount_percent::numeric / 100)), v_digits);
  END IF;

  v_status := v_row.attendee_status;
  v_result := v_row.result_code;

  IF v_discounted = 0 AND v_row.result_code <> 'waitlist' THEN
    v_status := 'confirmed';
    v_result := 'confirmed';
    UPDATE public.event_attendees SET status = 'confirmed' WHERE id = v_row.attendee_id;
    INSERT INTO public.event_discount_code_redemptions (
      code_id, attendee_id, status, discount_percent, discount_amount, ticket_count, consumed_at
    ) VALUES (
      v_code.id, v_row.attendee_id, 'consumed', v_code.discount_percent, v_code.discount_amount, v_code.ticket_count, now()
    );
  ELSE
    INSERT INTO public.event_discount_code_redemptions (
      code_id, attendee_id, status, discount_percent, discount_amount, ticket_count
    ) VALUES (
      v_code.id, v_row.attendee_id, 'reserved', v_code.discount_percent, v_code.discount_amount, v_code.ticket_count
    );
  END IF;

  RETURN QUERY SELECT
    v_row.attendee_id,
    v_status,
    v_discounted > 0,
    v_row.payment_id,
    v_result,
    v_row.seats,
    v_discounted;
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_event_attendee_with_discount(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, UUID, JSONB, TEXT, NUMERIC
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_event_attendee_with_discount(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, UUID, JSONB, TEXT, NUMERIC
) TO service_role;
