-- Public registration: preferred academic section (current cohort) instead of free-text "level".

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS preferred_section_id UUID REFERENCES public.academic_sections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_preferred_section_idx
  ON public.registrations (preferred_section_id)
  WHERE preferred_section_id IS NOT NULL;

COMMENT ON COLUMN public.registrations.preferred_section_id IS
  'Section the applicant selected on the public form (must belong to the current cohort).';

-- Label for storing level_interest display + validation that the id is allowed for public signup.
CREATE OR REPLACE FUNCTION public.registration_public_section_label(p_section_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name || ' — ' || s.name
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE s.id = p_section_id
    AND c.is_current = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.registration_public_section_label(uuid) IS
  'Returns cohort — section label if the section is in the current cohort; else NULL (invalid for public registration).';

GRANT EXECUTE ON FUNCTION public.registration_public_section_label(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_section_label(uuid) TO authenticated;

-- Options for <select> on /register (anon-safe list).
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
  ORDER BY c.name, s.name;
$$;

COMMENT ON FUNCTION public.list_registration_section_options() IS
  'Sections offered for public enrollment (current cohort only).';

GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO authenticated;

-- FK insert on registrations.preferred_section_id must pass RLS on academic_sections (PostgreSQL FK check).
-- Allow anon to read only cohorts/sections that are offered for public signup (current cohort).
DROP POLICY IF EXISTS academic_cohorts_select_public_current ON public.academic_cohorts;
CREATE POLICY academic_cohorts_select_public_current ON public.academic_cohorts
  FOR SELECT TO anon
  USING (is_current = true);

DROP POLICY IF EXISTS academic_sections_select_public_registration ON public.academic_sections;
CREATE POLICY academic_sections_select_public_registration ON public.academic_sections
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.academic_cohorts c
      WHERE c.id = academic_sections.cohort_id
        AND c.is_current = true
    )
  );
