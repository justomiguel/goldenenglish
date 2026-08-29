-- Public register picker: list every current non-archived section, including
-- full ones, with schedule slots, open-seat flag, and resolved trial offer.
-- Occupied seats = active enrollments + trial seats booked or attended.

CREATE OR REPLACE FUNCTION public.list_registration_section_picker_options()
RETURNS TABLE (
  id uuid,
  label text,
  schedule_slots jsonb,
  has_open_seat boolean,
  offers_trial boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         c.name || ' — ' || s.name AS label,
         COALESCE(s.schedule_slots, '[]'::jsonb) AS schedule_slots,
         (
           s.max_students IS NULL
           OR (
             (
               SELECT count(*)
               FROM public.section_enrollments se
               WHERE se.section_id = s.id
                 AND se.status = 'active'
             ) + (
               SELECT count(*)
               FROM public.registration_trial_seats ts
               WHERE ts.section_id = s.id
                 AND ts.status IN ('booked', 'attended')
             )
           ) < s.max_students
         ) AS has_open_seat,
         COALESCE(s.offers_trial, c.offers_trial) AS offers_trial
  FROM public.academic_sections s
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE c.is_current = true
    AND c.archived_at IS NULL
    AND s.archived_at IS NULL
  ORDER BY c.name, s.name;
$$;

COMMENT ON FUNCTION public.list_registration_section_picker_options() IS
  'Current-cohort sections for the public register picker, including full groups.';

REVOKE ALL ON FUNCTION public.list_registration_section_picker_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_registration_section_picker_options() TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_picker_options() TO authenticated;

-- Legacy combo (hides full) now also treats held trial seats as occupied.
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
        (
          SELECT count(*)
          FROM public.section_enrollments se
          WHERE se.section_id = s.id
            AND se.status = 'active'
        ) + (
          SELECT count(*)
          FROM public.registration_trial_seats ts
          WHERE ts.section_id = s.id
            AND ts.status IN ('booked', 'attended')
        )
      ) < s.max_students
    )
  ORDER BY c.name, s.name;
$$;

COMMENT ON FUNCTION public.list_registration_section_options() IS
  'Sections offered for public enrollment (current cohort, not archived, with open seats).';

REVOKE ALL ON FUNCTION public.list_registration_section_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO anon;
GRANT EXECUTE ON FUNCTION public.list_registration_section_options() TO authenticated;
