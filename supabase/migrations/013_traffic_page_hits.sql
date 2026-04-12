-- Raw page impressions (authenticated, guests, bots) for traffic analytics.

DO $$
BEGIN
  CREATE TYPE public.traffic_visitor_kind AS ENUM (
    'authenticated',
    'guest',
    'bot'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.traffic_page_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_kind public.traffic_visitor_kind NOT NULL,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  pathname TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  geo_country TEXT,
  geo_region TEXT,
  client_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT traffic_page_hits_pathname_len CHECK (char_length(pathname) <= 2048)
);

CREATE INDEX IF NOT EXISTS traffic_page_hits_created_idx
  ON public.traffic_page_hits (created_at DESC);
CREATE INDEX IF NOT EXISTS traffic_page_hits_kind_created_idx
  ON public.traffic_page_hits (visitor_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS traffic_page_hits_geo_created_idx
  ON public.traffic_page_hits (geo_country, created_at DESC);

ALTER TABLE public.traffic_page_hits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS traffic_page_hits_admin_select ON public.traffic_page_hits;
CREATE POLICY traffic_page_hits_admin_select ON public.traffic_page_hits
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Inserts only from server with service role (no INSERT policy for clients).

CREATE OR REPLACE FUNCTION public.admin_traffic_summary(p_days int)
RETURNS TABLE (
  authenticated_hits bigint,
  guest_hits bigint,
  bot_hits bigint,
  total_hits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE t.visitor_kind = 'authenticated')::bigint,
    COUNT(*) FILTER (WHERE t.visitor_kind = 'guest')::bigint,
    COUNT(*) FILTER (WHERE t.visitor_kind = 'bot')::bigint,
    COUNT(*)::bigint
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_traffic_daily_stacked(p_days int)
RETURNS TABLE (
  day date,
  authenticated_hits bigint,
  guest_hits bigint,
  bot_hits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH today AS (
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date AS d
  ),
  days AS (
    SELECT generate_series(
      (SELECT d FROM today) - p_days,
      (SELECT d FROM today),
      interval '1 day'
    )::date AS day
  ),
  agg AS (
    SELECT
      (t.created_at AT TIME ZONE 'America/Argentina/Cordoba')::date AS dday,
      COUNT(*) FILTER (WHERE t.visitor_kind = 'authenticated')::bigint AS ah,
      COUNT(*) FILTER (WHERE t.visitor_kind = 'guest')::bigint AS gh,
      COUNT(*) FILTER (WHERE t.visitor_kind = 'bot')::bigint AS bh
    FROM public.traffic_page_hits t
    WHERE t.created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    d.day,
    COALESCE(a.ah, 0)::bigint,
    COALESCE(a.gh, 0)::bigint,
    COALESCE(a.bh, 0)::bigint
  FROM days d
  LEFT JOIN agg a ON a.dday = d.day
  ORDER BY d.day;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_summary(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_traffic_daily_stacked(int) TO authenticated;
