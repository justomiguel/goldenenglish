-- Bulk companion to section_enrollment_link_state, so the teacher's section list can
-- offer a copy button without one round trip per section. Same staff gate, applied per
-- row: a caller sees only the links of sections they administer or staff.
CREATE OR REPLACE FUNCTION public.section_enrollment_links_for_staff()
RETURNS TABLE (section_id UUID, token UUID, is_active BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.section_id, l.token, l.is_active
  FROM public.section_enrollment_links l
  WHERE public.is_admin(auth.uid())
     OR public.user_leads_or_assists_section(auth.uid(), l.section_id);
$$;

COMMENT ON FUNCTION public.section_enrollment_links_for_staff() IS
  'Enrollment links for every section the caller administers or staffs; empty for anyone else.';

REVOKE ALL ON FUNCTION public.section_enrollment_links_for_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.section_enrollment_links_for_staff() FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_links_for_staff() TO authenticated;
