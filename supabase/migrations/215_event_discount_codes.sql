-- Per-event discount codes. A redemption is reserved in the same transaction as enroll.

CREATE TABLE IF NOT EXISTS public.event_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  code_normalized TEXT GENERATED ALWAYS AS (lower(btrim(code))) STORED,
  discount_percent SMALLINT NOT NULL,
  max_uses INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_discount_codes_code_len CHECK (char_length(btrim(code)) BETWEEN 1 AND 32),
  CONSTRAINT event_discount_codes_percent CHECK (discount_percent BETWEEN 1 AND 100),
  CONSTRAINT event_discount_codes_max_uses CHECK (max_uses IS NULL OR max_uses >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_discount_codes_event_code_idx
  ON public.event_discount_codes (event_id, code_normalized);

CREATE TABLE IF NOT EXISTS public.event_discount_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.event_discount_codes (id) ON DELETE RESTRICT,
  attendee_id UUID NOT NULL REFERENCES public.event_attendees (id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  discount_percent SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  CONSTRAINT event_discount_code_redemptions_status CHECK (status IN ('reserved', 'consumed', 'released')),
  CONSTRAINT event_discount_code_redemptions_percent CHECK (discount_percent BETWEEN 1 AND 100),
  CONSTRAINT event_discount_code_redemptions_attendee_unique UNIQUE (attendee_id)
);

CREATE INDEX IF NOT EXISTS event_discount_code_redemptions_code_status_idx
  ON public.event_discount_code_redemptions (code_id, status);

ALTER TABLE public.event_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_discount_code_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_discount_codes_admin ON public.event_discount_codes;
CREATE POLICY event_discount_codes_admin
  ON public.event_discount_codes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS event_discount_code_redemptions_admin ON public.event_discount_code_redemptions;
CREATE POLICY event_discount_code_redemptions_admin
  ON public.event_discount_code_redemptions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.delete_event_discount_code(p_code_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occupied INT;
BEGIN
  SELECT count(*)::int INTO v_occupied
  FROM public.event_discount_code_redemptions
  WHERE code_id = p_code_id AND status IN ('reserved', 'consumed');

  IF v_occupied > 0 THEN
    RETURN 'occupied';
  END IF;

  DELETE FROM public.event_discount_code_redemptions WHERE code_id = p_code_id;

  DELETE FROM public.event_discount_codes WHERE id = p_code_id;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.delete_event_discount_code(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_event_discount_code(UUID) TO service_role;

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
  v_base := CASE
    WHEN p_flow_unit_price IS NOT NULL THEN round(p_flow_unit_price * GREATEST(coalesce(v_row.seats, 1), 1), 2)
    ELSE coalesce(v_row.total_amount, 0)
  END;

  IF upper(coalesce(v_currency, '')) IN ('CLP', 'ARS') THEN
    v_discounted := round(v_base * (1 - (v_code.discount_percent::numeric / 100)), 0);
  ELSE
    v_discounted := round(v_base * (1 - (v_code.discount_percent::numeric / 100)), 2);
  END IF;

  v_status := v_row.attendee_status;
  v_result := v_row.result_code;

  IF v_discounted = 0 AND v_row.result_code <> 'waitlist' THEN
    v_status := 'confirmed';
    v_result := 'confirmed';
    UPDATE public.event_attendees SET status = 'confirmed' WHERE id = v_row.attendee_id;
    INSERT INTO public.event_discount_code_redemptions (
      code_id, attendee_id, status, discount_percent, consumed_at
    ) VALUES (
      v_code.id, v_row.attendee_id, 'consumed', v_code.discount_percent, now()
    );
  ELSE
    INSERT INTO public.event_discount_code_redemptions (
      code_id, attendee_id, status, discount_percent
    ) VALUES (
      v_code.id, v_row.attendee_id, 'reserved', v_code.discount_percent
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
