-- Top pathnames for guest (no session) hits — admin traffic analytics.

CREATE OR REPLACE FUNCTION public.admin_traffic_guest_path_breakdown(p_days int, p_limit int DEFAULT 500)
RETURNS TABLE (pathname text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(coalesce(nullif(p_limit, 0), 500), 2000);
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
    AND t.visitor_kind = 'guest'::public.traffic_visitor_kind
  GROUP BY t.pathname
  ORDER BY cnt DESC, pathname
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_guest_path_breakdown(int, int) TO authenticated;

CREATE INDEX IF NOT EXISTS traffic_page_hits_guest_path_created_idx
  ON public.traffic_page_hits (visitor_kind, pathname, created_at DESC);
