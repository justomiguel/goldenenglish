-- Count every registration produced by the section link, including accepted ones.
-- The panel copy talks about families who used the link; excluding status = enrolled
-- made the count drop to zero after accept, which looked like nobody had used it.

CREATE OR REPLACE FUNCTION public.section_enrollment_link_lead_count(p_section_id uuid)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_admin(auth.uid())
      OR public.user_leads_or_assists_section(auth.uid(), p_section_id)
    THEN (
      SELECT count(*)
      FROM public.registrations r
      WHERE r.source_section_link_id = p_section_id
    )
    ELSE 0::BIGINT
  END;
$$;

COMMENT ON FUNCTION public.section_enrollment_link_lead_count(uuid) IS
  'Registrations produced by a section enrollment link, including enrolled; zero unless the caller is an admin or section staff.';

REVOKE ALL ON FUNCTION public.section_enrollment_link_lead_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.section_enrollment_link_lead_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_lead_count(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.section_enrollment_link_state(p_section_id uuid)
RETURNS TABLE (
  token UUID,
  is_active BOOLEAN,
  lead_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.token,
    l.is_active,
    (
      SELECT count(*)
      FROM public.registrations r
      WHERE r.source_section_link_id = p_section_id
    )
  FROM public.section_enrollment_links l
  WHERE l.section_id = p_section_id
    AND (
      public.is_admin(auth.uid())
      OR public.user_leads_or_assists_section(auth.uid(), p_section_id)
    )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.section_enrollment_link_state(uuid) IS
  'Token, active flag and attributed registration count for a section, for admins and that section''s staff only.';

REVOKE ALL ON FUNCTION public.section_enrollment_link_state(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.section_enrollment_link_state(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_state(uuid) TO authenticated;
