-- A short hold while a buyer is choosing seats.
-- The unique key blocks two live holds on the same seat.
-- Expired rows lose the race inside hold_event_seats.

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_seat_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  seat_key TEXT NOT NULL,
  hold_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_seat_holds_event_seat_unique UNIQUE (event_id, seat_key)
);

CREATE INDEX IF NOT EXISTS idx_event_seat_holds_token
  ON public.event_seat_holds (hold_token_hash);

CREATE INDEX IF NOT EXISTS idx_event_seat_holds_expires_at
  ON public.event_seat_holds (expires_at);

ALTER TABLE public.event_seat_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_seat_holds_modify_admin ON public.event_seat_holds;
CREATE POLICY event_seat_holds_modify_admin ON public.event_seat_holds
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.hold_event_seats(
  p_event_id uuid,
  p_token_hash text,
  p_seat_keys text[],
  p_max_seats int,
  p_ttl_seconds int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_keys text[];
  v_taken text[] := ARRAY[]::text[];
  v_held text[] := ARRAY[]::text[];
  v_expires timestamptz;
  v_key text;
  v_max int;
BEGIN
  IF p_token_hash IS NULL OR length(trim(p_token_hash)) < 32 THEN
    RETURN jsonb_build_object(
      'held', '[]'::jsonb,
      'taken', '[]'::jsonb,
      'expires_at', NULL,
      'code', 'invalid_token'
    );
  END IF;

  SELECT COALESCE(array_agg(DISTINCT trim(k)), ARRAY[]::text[])
    INTO v_keys
  FROM unnest(COALESCE(p_seat_keys, ARRAY[]::text[])) AS k
  WHERE length(trim(k)) > 0;

  v_max := LEAST(GREATEST(COALESCE(p_max_seats, 1), 1), 50);
  IF cardinality(v_keys) > v_max THEN
    RETURN jsonb_build_object(
      'held', '[]'::jsonb,
      'taken', to_jsonb(v_keys),
      'expires_at', NULL,
      'code', 'too_many'
    );
  END IF;

  v_expires := now() + make_interval(secs => LEAST(GREATEST(COALESCE(p_ttl_seconds, 600), 60), 900));

  DELETE FROM public.event_seat_holds
  WHERE event_id = p_event_id
    AND expires_at <= now();

  DELETE FROM public.event_seat_holds
  WHERE event_id = p_event_id
    AND hold_token_hash = p_token_hash
    AND NOT (seat_key = ANY (v_keys));

  FOREACH v_key IN ARRAY v_keys LOOP
    IF EXISTS (
      SELECT 1 FROM public.event_seat_locks
      WHERE event_id = p_event_id AND seat_key = v_key
    ) OR EXISTS (
      SELECT 1 FROM public.event_seat_holds
      WHERE event_id = p_event_id
        AND seat_key = v_key
        AND hold_token_hash <> p_token_hash
        AND expires_at > now()
    ) THEN
      v_taken := array_append(v_taken, v_key);
    ELSE
      INSERT INTO public.event_seat_holds (event_id, seat_key, hold_token_hash, expires_at)
      VALUES (p_event_id, v_key, p_token_hash, v_expires)
      ON CONFLICT (event_id, seat_key) DO UPDATE
        SET hold_token_hash = EXCLUDED.hold_token_hash,
            expires_at = EXCLUDED.expires_at
        WHERE public.event_seat_holds.hold_token_hash = EXCLUDED.hold_token_hash
           OR public.event_seat_holds.expires_at <= now();
      IF FOUND THEN
        v_held := array_append(v_held, v_key);
      ELSE
        v_taken := array_append(v_taken, v_key);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'held', to_jsonb(v_held),
    'taken', to_jsonb(v_taken),
    'expires_at', v_expires,
    'code', 'ok'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_event_seat_holds(
  p_event_id uuid,
  p_token_hash text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token_hash IS NULL OR length(trim(p_token_hash)) < 32 THEN
    RETURN;
  END IF;
  DELETE FROM public.event_seat_holds
  WHERE event_id = p_event_id
    AND hold_token_hash = p_token_hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_event_seats(
  p_event_id uuid,
  p_attendee_id uuid,
  p_token_hash text,
  p_seats jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taken text[] := ARRAY[]::text[];
  v_key text;
  v_label text;
BEGIN
  IF p_token_hash IS NULL OR length(trim(p_token_hash)) < 32 THEN
    RETURN jsonb_build_object('ok', false, 'taken', '[]'::jsonb, 'code', 'invalid_token');
  END IF;

  PERFORM 1
  FROM public.event_seat_holds
  WHERE event_id = p_event_id
    AND hold_token_hash = p_token_hash
  FOR UPDATE;

  FOR v_key, v_label IN
    SELECT value->>'seat_key', value->>'seat_label'
    FROM jsonb_array_elements(COALESCE(p_seats, '[]'::jsonb))
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.event_seat_locks
      WHERE event_id = p_event_id AND seat_key = v_key
    ) OR EXISTS (
      SELECT 1 FROM public.event_seat_holds
      WHERE event_id = p_event_id
        AND seat_key = v_key
        AND expires_at > now()
        AND hold_token_hash <> p_token_hash
    ) OR NOT EXISTS (
      SELECT 1 FROM public.event_seat_holds
      WHERE event_id = p_event_id
        AND seat_key = v_key
        AND hold_token_hash = p_token_hash
        AND expires_at > now()
    ) THEN
      v_taken := array_append(v_taken, v_key);
    END IF;
  END LOOP;

  IF cardinality(v_taken) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'taken', to_jsonb(v_taken), 'code', 'seat_already_taken');
  END IF;

  INSERT INTO public.event_seat_locks (event_id, seat_key, seat_label, attendee_id)
  SELECT p_event_id, value->>'seat_key', COALESCE(value->>'seat_label', value->>'seat_key'), p_attendee_id
  FROM jsonb_array_elements(p_seats);

  UPDATE public.event_attendees
  SET seat_labels = (
    SELECT COALESCE(array_agg(value->>'seat_label'), ARRAY[]::text[])
    FROM jsonb_array_elements(p_seats)
  )
  WHERE id = p_attendee_id;

  DELETE FROM public.event_seat_holds
  WHERE event_id = p_event_id
    AND hold_token_hash = p_token_hash;

  RETURN jsonb_build_object('ok', true, 'taken', '[]'::jsonb, 'code', 'ok');
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', false,
      'taken', COALESCE((
        SELECT jsonb_agg(value->>'seat_key')
        FROM jsonb_array_elements(COALESCE(p_seats, '[]'::jsonb))
      ), '[]'::jsonb),
      'code', 'seat_already_taken'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.hold_event_seats(uuid, text, text[], int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_event_seat_holds(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_event_seats(uuid, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hold_event_seats(uuid, text, text[], int, int) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.release_event_seat_holds(uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_event_seats(uuid, uuid, text, jsonb) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.hold_event_seats(uuid, text, text[], int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_event_seat_holds(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_event_seats(uuid, uuid, text, jsonb) TO service_role;

COMMIT;
