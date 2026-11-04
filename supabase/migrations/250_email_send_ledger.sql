-- Monthly mail ledger and the admin home ops snapshot.

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_send_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz NOT NULL DEFAULT now(),
  template_key text NOT NULL,
  recipient_count integer NOT NULL CHECK (recipient_count > 0)
);

CREATE INDEX IF NOT EXISTS email_send_ledger_sent_at_idx
  ON public.email_send_ledger (sent_at);

ALTER TABLE public.email_send_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_send_ledger_admin_select ON public.email_send_ledger;
CREATE POLICY email_send_ledger_admin_select
  ON public.email_send_ledger
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.email_send_ledger FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.email_send_ledger TO authenticated;
GRANT ALL ON TABLE public.email_send_ledger TO service_role;

CREATE OR REPLACE FUNCTION public.email_send_month_usage()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'used', COALESCE((
      SELECT SUM(recipient_count)::int
      FROM public.email_send_ledger
      WHERE sent_at >= (date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
    ), 0),
    'cap', COALESCE((
      SELECT CASE
        WHEN jsonb_typeof(value) = 'number'
          AND (value::text)::int BETWEEN 1 AND 100000
        THEN (value::text)::int
        ELSE NULL
      END
      FROM public.site_settings
      WHERE key = 'email_monthly_cap'
    ), 5000)
  );
$$;

REVOKE ALL ON FUNCTION public.email_send_month_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.email_send_month_usage() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_home_ops_snapshot(
  p_today date,
  p_week_start date,
  p_week_end date,
  p_weekday int
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_cohort AS (
    SELECT c.id, c.name
    FROM public.academic_cohorts c
    WHERE c.is_current IS TRUE
      AND c.archived_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT 1
  ),
  meeting AS (
    SELECT s.id
    FROM public.academic_sections s
    JOIN current_cohort c ON c.id = s.cohort_id
    WHERE s.archived_at IS NULL
      AND jsonb_typeof(s.schedule_slots) = 'array'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(s.schedule_slots) AS slot
        WHERE slot->>'dayOfWeek' ~ '^[0-9]+$'
          AND (slot->>'dayOfWeek')::int = p_weekday
      )
  ),
  section_counts AS (
    SELECT
      s.max_students,
      COUNT(se.id) FILTER (WHERE se.status = 'active')::int AS active
    FROM public.academic_sections s
    JOIN current_cohort c ON c.id = s.cohort_id
    LEFT JOIN public.section_enrollments se ON se.section_id = s.id
    WHERE s.archived_at IS NULL
      AND s.max_students IS NOT NULL
    GROUP BY s.id, s.max_students
  )
  SELECT jsonb_build_object(
    'email_used', (public.email_send_month_usage() ->> 'used')::int,
    'email_cap', (public.email_send_month_usage() ->> 'cap')::int,
    'events', COALESCE((
      SELECT jsonb_agg(to_jsonb(ev) ORDER BY ev.event_date)
      FROM (
        SELECT
          e.id,
          e.slug,
          e.title,
          e.event_date,
          e.capacity,
          (
            SELECT COUNT(*)::int
            FROM public.event_attendees ea
            WHERE ea.event_id = e.id
              AND ea.status <> 'cancelled'
          ) AS seats
        FROM public.events e
        WHERE e.status = 'published'
          AND e.archived_at IS NULL
          AND e.event_date >= now()
        ORDER BY e.event_date
        LIMIT 3
      ) ev
    ), '[]'::jsonb),
    'waitlist_total', (
      SELECT COUNT(*)::int
      FROM public.event_attendees ea
      JOIN public.events e ON e.id = ea.event_id
      WHERE ea.status = 'waitlist'
        AND e.status = 'published'
        AND e.archived_at IS NULL
        AND e.event_date >= now()
    ),
    'cohort', (
      SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'active_enrollments', (
          SELECT COUNT(*)::int
          FROM public.section_enrollments se
          JOIN public.academic_sections s ON s.id = se.section_id
          WHERE s.cohort_id = c.id
            AND s.archived_at IS NULL
            AND se.status = 'active'
        )
      )
      FROM current_cohort c
    ),
    'classes_meeting', (SELECT COUNT(*)::int FROM meeting),
    'classes_missing_attendance', (
      SELECT COUNT(*)::int
      FROM meeting m
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.section_enrollments se
        JOIN public.section_attendance sa ON sa.enrollment_id = se.id
        WHERE se.section_id = m.id
          AND sa.attended_on = p_today
      )
    ),
    'trials_booked', (
      SELECT COUNT(*)::int
      FROM public.registration_trial_seats t
      WHERE t.scheduled_on BETWEEN p_week_start AND p_week_end
        AND t.status = 'booked'
    ),
    'trials_attended', (
      SELECT COUNT(*)::int
      FROM public.registration_trial_seats t
      WHERE t.scheduled_on BETWEEN p_week_start AND p_week_end
        AND t.status = 'attended'
    ),
    'trials_released', (
      SELECT COUNT(*)::int
      FROM public.registration_trial_seats t
      WHERE t.scheduled_on BETWEEN p_week_start AND p_week_end
        AND t.status = 'released'
    ),
    'sections_full', (
      SELECT COUNT(*)::int FROM section_counts WHERE active >= max_students
    ),
    'sections_one_left', (
      SELECT COUNT(*)::int FROM section_counts WHERE max_students - active = 1
    ),
    'event_payments_pending_review', (
      SELECT COUNT(*)::int
      FROM public.event_payments p
      WHERE p.status = 'pending'
        AND p.gateway_provider IS NULL
    )
  );
$$;

REVOKE ALL ON FUNCTION public.admin_home_ops_snapshot(date, date, date, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_home_ops_snapshot(date, date, date, int) TO authenticated;

COMMIT;
