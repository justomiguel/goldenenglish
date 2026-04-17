-- RPC: profile counts by role + students without active section enrollment.
-- Replaces the full profiles scan in loadAdminHubSummary (Rule 13 compliance).

CREATE OR REPLACE FUNCTION public.admin_hub_profile_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_counts AS (
    SELECT role::text AS role, count(*)::int AS cnt
    FROM public.profiles
    WHERE role IS NOT NULL
    GROUP BY role
  ),
  total AS (
    SELECT coalesce(sum(cnt), 0)::int AS total FROM role_counts
  ),
  students_without_section AS (
    SELECT count(*)::int AS cnt
    FROM public.profiles p
    WHERE p.role = 'student'
      AND NOT EXISTS (
        SELECT 1 FROM public.section_enrollments se
        WHERE se.student_id = p.id
          AND se.status = 'active'
      )
  )
  SELECT jsonb_build_object(
    'total', (SELECT total FROM total),
    'by_role', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('role', role, 'count', cnt) ORDER BY cnt DESC)
       FROM role_counts),
      '[]'::jsonb
    ),
    'students_without_section', (SELECT cnt FROM students_without_section)
  );
$$;

COMMENT ON FUNCTION public.admin_hub_profile_counts() IS
  'Aggregated profile counts by role + students without active section enrollment for admin hub.';

REVOKE ALL ON FUNCTION public.admin_hub_profile_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_hub_profile_counts() TO authenticated;
