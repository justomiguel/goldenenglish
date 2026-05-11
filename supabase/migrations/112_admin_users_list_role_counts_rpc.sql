-- RPC: totals for admin users list role filter (no full-table fetch in Next).
CREATE OR REPLACE FUNCTION public.admin_users_list_role_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_role AS (
    SELECT lower(role::text) AS role_norm, count(*)::bigint AS cnt
    FROM public.profiles
    WHERE role IS NOT NULL
      AND trim(role::text) <> ''
    GROUP BY lower(role::text)
  )
  SELECT jsonb_build_object(
    'total',
    (SELECT count(*)::bigint FROM public.profiles),
    'by_role',
    COALESCE(
      (
        SELECT jsonb_object_agg(role_norm, cnt)
        FROM per_role
      ),
      '{}'::jsonb
    )
  );
$$;

COMMENT ON FUNCTION public.admin_users_list_role_counts() IS
  'Totals for profiles (all rows) plus per-role counts (lowercase role key) for admin users screen filter dropdown.';

REVOKE ALL ON FUNCTION public.admin_users_list_role_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_users_list_role_counts() TO authenticated;
