-- Country totals from traffic_page_hits (edge geo, ISO alpha-2) for admin choropleth.

CREATE OR REPLACE FUNCTION public.admin_traffic_geo_totals(p_days int)
RETURNS TABLE (country text, cnt bigint)
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
    upper(trim(t.geo_country)) AS country,
    COUNT(*)::bigint AS cnt
  FROM public.traffic_page_hits t
  WHERE t.created_at >= now() - (p_days || ' days')::interval
    AND t.geo_country IS NOT NULL
    AND btrim(t.geo_country) <> ''
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 250;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_traffic_geo_totals(int) TO authenticated;

-- ---------------------------------------------------------------------------
-- Combined from legacy 014_profiles_update_linked_student_by_tutor.sql
-- Padre/tutor autenticado puede actualizar perfiles de alumnos vinculados.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_update_linked_student_by_tutor ON public.profiles;

CREATE POLICY profiles_update_linked_student_by_tutor
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
    AND profiles.role = 'student'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
    AND role = 'student'
  );
