-- Per visitor_kind breakdowns for the admin analytics traffic cards
-- (top pathnames + top user-agents). Bounded result sets for the UI tabs.

CREATE OR REPLACE FUNCTION public.admin_traffic_kind_path_breakdown(
  p_kind public.traffic_visitor_kind,
  p_days int,
  p_limit int DEFAULT 200
)
RETURNS TABLE (pathname text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 200), 1000);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    t.pathname,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.visitor_kind = p_kind
  GROUP BY t.pathname
  ORDER BY cnt DESC, pathname
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_kind_path_breakdown(public.traffic_visitor_kind, int, int)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_traffic_kind_agent_breakdown(
  p_kind public.traffic_visitor_kind,
  p_days int,
  p_limit int DEFAULT 100
)
RETURNS TABLE (user_agent text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 100), 500);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    coalesce(nullif(btrim(t.user_agent), ''), '(unknown)') AS user_agent,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.visitor_kind = p_kind
  GROUP BY 1
  ORDER BY cnt DESC, user_agent
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_kind_agent_breakdown(public.traffic_visitor_kind, int, int)
  TO authenticated;

CREATE INDEX IF NOT EXISTS traffic_page_hits_kind_path_created_idx
  ON public.traffic_page_hits (visitor_kind, pathname, created_at DESC);

CREATE INDEX IF NOT EXISTS traffic_page_hits_kind_ua_created_idx
  ON public.traffic_page_hits (visitor_kind, user_agent, created_at DESC);
