-- Extra sections on a public registration lead, plus a name-only student lookup
-- for the inscription wizard. Additive only.
-- Spec: docs/superpowers/specs/2026-08-24-registration-existing-student-and-multi-section-design.md

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS additional_section_ids UUID[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.registrations.additional_section_ids IS
  'Academic sections requested besides preferred_section_id. Empty when undecided or a single pick.';

CREATE OR REPLACE FUNCTION public.lookup_registration_student(p_dni text)
RETURNS TABLE (found boolean, first_name text, last_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_first text;
  v_last text;
  v_role public.user_role;
BEGIN
  v_norm := lower(trim(both FROM replace(replace(COALESCE(p_dni, ''), '.', ''), ' ', '')));
  IF v_norm = '' THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT p.first_name, p.last_name, p.role
    INTO v_first, v_last, v_role
  FROM public.profiles p
  WHERE lower(trim(both FROM replace(replace(COALESCE(p.dni_or_passport, ''), '.', ''), ' ', ''))) = v_norm
  LIMIT 1;

  IF v_role = 'student' THEN
    RETURN QUERY SELECT true, v_first, v_last;
  ELSE
    RETURN QUERY SELECT false, NULL::text, NULL::text;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.lookup_registration_student(text) IS
  'Anonymous registration lookup: student first/last name by document, or found=false. No other columns.';

REVOKE ALL ON FUNCTION public.lookup_registration_student(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_registration_student(text) TO anon, authenticated;
