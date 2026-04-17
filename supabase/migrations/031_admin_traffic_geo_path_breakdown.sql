-- Top (country, pathname) pairs from traffic_page_hits for admin analytics (bounded).

CREATE OR REPLACE FUNCTION public.admin_traffic_geo_path_breakdown(p_days int, p_limit int DEFAULT 500)
RETURNS TABLE (country text, pathname text, cnt bigint)
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
    upper(trim(t.geo_country)) AS country,
    t.pathname,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.geo_country IS NOT NULL
    AND btrim(t.geo_country) <> ''
  GROUP BY 1, 2
  ORDER BY 3 DESC, 1, 2
  LIMIT lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_geo_path_breakdown(int, int) TO authenticated;

CREATE INDEX IF NOT EXISTS traffic_page_hits_geo_path_created_idx
  ON public.traffic_page_hits (geo_country, pathname, created_at DESC);
