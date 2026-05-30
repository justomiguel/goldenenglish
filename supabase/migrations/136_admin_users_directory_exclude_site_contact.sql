-- Admin users directory: exclude synthetic website-contact sender from totals and role chips.

CREATE OR REPLACE FUNCTION public.admin_users_list_role_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible AS (
    SELECT role
    FROM public.profiles
    WHERE role IS DISTINCT FROM 'site_contact'::public.user_role
      AND id <> '6f0e8c8a-7b1d-4c2e-9f3a-8e5d2c1b0a99'::uuid
  ),
  per_role AS (
    SELECT lower(role::text) AS role_norm, count(*)::bigint AS cnt
    FROM eligible
    WHERE role IS NOT NULL
      AND trim(role::text) <> ''
    GROUP BY lower(role::text)
  )
  SELECT jsonb_build_object(
    'total',
    (SELECT count(*)::bigint FROM eligible),
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
  'Totals for admin users list: real directory profiles only (excludes site_contact synthetic sender).';
