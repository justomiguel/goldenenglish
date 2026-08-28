-- Public pre-registration only lists sections that still have a seat.
-- Unlimited sections (max_students IS NULL) stay listed, matching
-- resolve_section_enrollment_link's seats_remaining = NULL meaning.

CREATE OR REPLACE FUNCTION public.list_registration_section_options()
RETURNS TABLE (id uuid, label text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         c.name || ' — ' || s.name AS label
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE c.is_current = true
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
    AND (
      s.max_students IS NULL
      OR (
        SELECT count(*)
        FROM public.section_enrollments se
        WHERE se.section_id = s.id
          AND se.status = 'active'
      ) < s.max_students
    )
  ORDER BY c.name, s.name;
$$;

COMMENT ON FUNCTION public.list_registration_section_options() IS
  'Sections offered for public enrollment (current cohort, not archived, with open seats).';

REVOKE ALL ON FUNCTION public.list_registration_section_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO authenticated;
