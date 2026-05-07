-- Portal: upcoming student birthdays scoped by viewer role (sections, cohort peers, admin).
-- SECURITY DEFINER: enforces viewer via p_viewer_id; JWT callers must pass auth.uid(); service_role (ICS feed) may pass token owner id.

CREATE OR REPLACE FUNCTION public.portal_upcoming_birthdays_for_viewer(
  p_viewer_id uuid,
  p_range_start date,
  p_range_end date
)
RETURNS TABLE (
  student_id uuid,
  first_name text,
  last_name text,
  birth_date date,
  celebration_date date,
  is_celebration_today boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date;
  v_role text;
BEGIN
  IF auth.uid() IS NOT NULL AND p_viewer_id <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_range_start IS NULL OR p_range_end IS NULL OR p_range_end < p_range_start THEN
    RETURN;
  END IF;

  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date;

  SELECT p.role::text INTO v_role FROM public.profiles p WHERE p.id = p_viewer_id LIMIT 1;
  IF v_role IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT pr.id AS sid, pr.first_name, pr.last_name, pr.birth_date
    FROM public.profiles pr
    WHERE pr.role = 'student'
      AND pr.birth_date IS NOT NULL
      AND (
        public.is_admin(p_viewer_id)
        OR (
          v_role = 'assistant'
          AND EXISTS (
            SELECT 1
            FROM public.section_enrollments se
            JOIN public.academic_sections sec ON sec.id = se.section_id
            WHERE se.student_id = pr.id
              AND se.status = 'active'
              AND sec.archived_at IS NULL
          )
        )
        OR (
          v_role = 'teacher'
          AND EXISTS (
            SELECT 1
            FROM public.section_enrollments se
            JOIN public.academic_sections sec ON sec.id = se.section_id
            WHERE se.student_id = pr.id
              AND se.status = 'active'
              AND sec.archived_at IS NULL
              AND public.user_leads_or_assists_section(p_viewer_id, se.section_id)
          )
        )
        OR (
          v_role = 'student'
          AND (
            pr.id = p_viewer_id
            OR EXISTS (
              SELECT 1
              FROM public.section_enrollments se1
              JOIN public.section_enrollments se2
                ON se1.section_id = se2.section_id AND se2.student_id = p_viewer_id
              JOIN public.academic_sections sec ON sec.id = se1.section_id
              WHERE se1.student_id = pr.id
                AND se1.status = 'active'
                AND se2.status = 'active'
                AND sec.archived_at IS NULL
            )
          )
        )
        OR (
          v_role = 'parent'
          AND (
            EXISTS (
              SELECT 1 FROM public.tutor_student_rel ts
              WHERE ts.tutor_id = p_viewer_id AND ts.student_id = pr.id
            )
            OR EXISTS (
              SELECT 1
              FROM public.tutor_student_rel ts
              JOIN public.section_enrollments sew ON sew.student_id = ts.student_id AND sew.status = 'active'
              JOIN public.section_enrollments sep
                ON sep.section_id = sew.section_id AND sep.student_id = pr.id AND sep.status = 'active'
              JOIN public.academic_sections sec ON sec.id = sew.section_id
              WHERE ts.tutor_id = p_viewer_id
                AND sec.archived_at IS NULL
            )
          )
        )
      )
  ),
  matches AS (
    SELECT
      s.sid AS student_id,
      s.first_name,
      s.last_name,
      s.birth_date,
      gs.d::date AS celebration_date
    FROM scoped s
    CROSS JOIN LATERAL generate_series(
      p_range_start,
      p_range_end,
      interval '1 day'
    ) AS gs(d)
    WHERE to_char(gs.d::date, 'MM-DD') = to_char(s.birth_date, 'MM-DD')
  )
  SELECT
    m.student_id,
    m.first_name,
    m.last_name,
    m.birth_date,
    m.celebration_date,
    (m.celebration_date = v_today) AS is_celebration_today
  FROM matches m
  ORDER BY m.celebration_date, m.last_name, m.first_name;
END;
$$;

COMMENT ON FUNCTION public.portal_upcoming_birthdays_for_viewer(uuid, date, date) IS
  'Returns student birthday celebrations (month/day) falling in [p_range_start, p_range_end] in institute (Cordoba) civil dates, scoped to sections/tutor/admin for p_viewer_id.';

GRANT EXECUTE ON FUNCTION public.portal_upcoming_birthdays_for_viewer(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.portal_upcoming_birthdays_for_viewer(uuid, date, date) TO service_role;
