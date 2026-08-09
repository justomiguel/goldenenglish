-- 185_events_aggregates_seats.sql
--
-- Seats and registrations are different numbers now.
--
-- Until packages, one attendee row was one person who signed up, so counting
-- rows answered both "how many people registered" and "how many seats are
-- taken". A multi-ticket purchase is one titular row plus one row per
-- companion, so those two questions now have different answers and an admin
-- reading a single number cannot tell which one they got.
--
-- Both aggregate functions keep every column they already returned, counting
-- exactly what they counted before (the loaders read by name), and gain
-- total_registrations (titular rows only) and total_seats (every row that still
-- holds a seat).
--
-- The return type widens, which CREATE OR REPLACE cannot do, so each function is
-- dropped and recreated in this transaction.

BEGIN;

DROP FUNCTION IF EXISTS public.events_admin_list_aggregates(TEXT, public.event_status[]);

CREATE OR REPLACE FUNCTION public.events_admin_list_aggregates(
  p_search TEXT DEFAULT '',
  p_status public.event_status[] DEFAULT NULL
)
RETURNS TABLE (
  total_events BIGINT,
  total_published BIGINT,
  total_upcoming BIGINT,
  total_attendees BIGINT,
  total_waitlist BIGINT,
  total_registrations BIGINT,
  total_seats BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered_events AS (
    SELECT e.id, e.status, e.event_date
    FROM public.events e
    WHERE e.archived_at IS NULL
      AND (
        p_search IS NULL
        OR btrim(p_search) = ''
        OR e.title ILIKE ('%' || p_search || '%')
        OR e.slug ILIKE ('%' || p_search || '%')
      )
      AND (
        p_status IS NULL
        OR cardinality(p_status) = 0
        OR e.status = ANY(p_status)
      )
  )
  SELECT
    COUNT(*)::bigint AS total_events,
    COUNT(*) FILTER (WHERE fe.status = 'published')::bigint AS total_published,
    COUNT(*) FILTER (WHERE fe.event_date >= now())::bigint AS total_upcoming,
    -- Unchanged meaning: every attendee row, whatever its status.
    (
      SELECT COUNT(*)::bigint
      FROM public.event_attendees ea
      WHERE ea.event_id IN (SELECT id FROM filtered_events)
    ) AS total_attendees,
    (
      SELECT COUNT(*)::bigint
      FROM public.event_attendees ea
      WHERE ea.event_id IN (SELECT id FROM filtered_events)
        AND ea.status = 'waitlist'
    ) AS total_waitlist,
    (
      SELECT COUNT(*) FILTER (WHERE ea.primary_attendee_id IS NULL)::bigint
      FROM public.event_attendees ea
      WHERE ea.event_id IN (SELECT id FROM filtered_events)
        AND ea.status <> 'cancelled'
    ) AS total_registrations,
    (
      SELECT COUNT(*)::bigint
      FROM public.event_attendees ea
      WHERE ea.event_id IN (SELECT id FROM filtered_events)
        AND ea.status <> 'cancelled'
    ) AS total_seats
  FROM filtered_events fe;
$$;

DROP FUNCTION IF EXISTS public.events_admin_attendees_aggregates(UUID);

CREATE OR REPLACE FUNCTION public.events_admin_attendees_aggregates(
  p_event_id UUID
)
RETURNS TABLE (
  total_attendees BIGINT,
  total_confirmed BIGINT,
  total_pending_payment BIGINT,
  total_waitlist BIGINT,
  total_cancelled BIGINT,
  total_registrations BIGINT,
  total_seats BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- The five originals keep counting rows by status, exactly as before.
    COUNT(*)::bigint AS total_attendees,
    COUNT(*) FILTER (WHERE ea.status = 'confirmed')::bigint AS total_confirmed,
    COUNT(*) FILTER (WHERE ea.status = 'pending_payment')::bigint AS total_pending_payment,
    COUNT(*) FILTER (WHERE ea.status = 'waitlist')::bigint AS total_waitlist,
    COUNT(*) FILTER (WHERE ea.status = 'cancelled')::bigint AS total_cancelled,
    COUNT(*) FILTER (
      WHERE ea.primary_attendee_id IS NULL AND ea.status <> 'cancelled'
    )::bigint AS total_registrations,
    COUNT(*) FILTER (WHERE ea.status <> 'cancelled')::bigint AS total_seats
  FROM public.event_attendees ea
  WHERE ea.event_id = p_event_id;
$$;

REVOKE ALL ON FUNCTION public.events_admin_list_aggregates(TEXT, public.event_status[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.events_admin_attendees_aggregates(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.events_admin_list_aggregates(TEXT, public.event_status[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.events_admin_attendees_aggregates(UUID) TO authenticated;

COMMIT;
