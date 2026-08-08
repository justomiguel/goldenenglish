-- Lead follow-up on public registrations: who contacted the lead and when,
-- plus per-status counts for the admin list filter.
-- Spec: docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacted_by UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.registrations.contacted_at IS
  'When the lead was last marked contacted; null while status is new.';
COMMENT ON COLUMN public.registrations.contacted_by IS
  'Admin who marked the lead contacted; null while status is new.';

-- Status counts under the active search, so the admin filter chips show real
-- totals instead of counting only the rows on the current page.
CREATE OR REPLACE FUNCTION public.registrations_admin_list_aggregates(
  p_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  total BIGINT,
  new_count BIGINT,
  contacted_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH needle AS (
    -- Same wildcard escaping as loadPaginatedRegistrations, so the chip counts
    -- can never disagree with the list they label.
    SELECT '%' || replace(replace(btrim(p_query), '%', '\%'), '_', '\_') || '%' AS pattern
  ),
  scoped AS (
    SELECT r.status
    FROM public.registrations r
    CROSS JOIN needle n
    WHERE r.status <> 'enrolled'
      AND (
        p_query IS NULL
        OR btrim(p_query) = ''
        OR r.first_name ILIKE n.pattern
        OR r.last_name  ILIKE n.pattern
        OR r.dni        ILIKE n.pattern
        OR r.email      ILIKE n.pattern
        OR r.phone      ILIKE n.pattern
      )
  )
  SELECT
    count(*)::BIGINT AS total,
    count(*) FILTER (WHERE status = 'new')::BIGINT AS new_count,
    count(*) FILTER (WHERE status = 'contacted')::BIGINT AS contacted_count
  FROM scoped;
$$;

REVOKE ALL ON FUNCTION public.registrations_admin_list_aggregates(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrations_admin_list_aggregates(TEXT) TO authenticated;
