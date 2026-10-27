-- Monday admin digest. One JSON payload per closed week, plus a send row so a retry does not mail the same admin twice.

CREATE TABLE IF NOT EXISTS public.admin_weekly_digest_sends (
  week_start date PRIMARY KEY,
  recipient_ids uuid[] NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_weekly_digest_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_weekly_digest_sends FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.admin_weekly_digest_sends TO service_role;

CREATE OR REPLACE FUNCTION public.admin_weekly_digest(
  p_week_start timestamptz,
  p_week_end timestamptz,
  p_month_start date,
  p_month_end date,
  p_silent_since timestamptz,
  p_tz text
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parents int;
  v_pending_receipts int;
  v_open_messages int;
  v_silent int;
  v_invoice_count int;
  v_paid_count int;
  v_pending_count int;
  v_review_count int;
  v_expected numeric;
  v_collected numeric;
  v_opened int;
  v_checkouts int;
  v_marked int;
  v_sections int;
  v_tasks_due int;
  v_tasks_open int;
  v_registrations int;
  v_events int;
  v_sessions int;
  v_views int;
  v_parent_percent int;
  v_percents jsonb;
  v_top jsonb;
  v_weekdays jsonb;
BEGIN
  SELECT count(*)::int INTO v_parents FROM public.profiles WHERE role::text = 'parent';

  SELECT
    (SELECT count(*)::int FROM public.billing_receipts WHERE status::text = 'pending_approval')
    + (SELECT count(*)::int FROM public.section_enrollments WHERE enrollment_fee_receipt_status = 'pending')
    + (SELECT count(*)::int FROM public.event_payments WHERE status::text = 'pending' AND receipt_storage_path IS NOT NULL)
  INTO v_pending_receipts;

  SELECT count(*)::int INTO v_open_messages
  FROM public.portal_messages m
  JOIN public.profiles sender ON sender.id = m.sender_id AND sender.role::text = 'parent'
  JOIN public.profiles recipient ON recipient.id = m.recipient_id AND recipient.role::text = 'admin'
  WHERE m.read_at IS NULL;

  SELECT count(DISTINCT COALESCE(link.tutor_id, student.id))::int INTO v_silent
  FROM public.profiles student
  LEFT JOIN LATERAL (
    SELECT rel.tutor_id
    FROM public.tutor_student_rel rel
    WHERE rel.student_id = student.id
    ORDER BY rel.tutor_id
    LIMIT 1
  ) link ON true
  WHERE student.role::text = 'student'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_events e
      WHERE e.user_id = student.id
        AND e.event_type::text = 'session_start'
        AND e.created_at >= p_silent_since
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.tutor_student_rel rel
      JOIN public.user_events e ON e.user_id = rel.tutor_id
      WHERE rel.student_id = student.id
        AND e.event_type::text = 'session_start'
        AND e.created_at >= p_silent_since
    );

  WITH month_invoices AS (
    SELECT
      i.status::text AS status,
      i.amount,
      EXISTS (
        SELECT 1 FROM public.billing_receipts r
        WHERE r.invoice_id = i.id AND r.status::text = 'pending_approval'
      ) AS has_pending_receipt
    FROM public.billing_invoices i
    WHERE i.due_date >= p_month_start
      AND i.due_date <= p_month_end
      AND i.status::text <> 'voided'
  )
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE status = 'paid')::int,
    count(*) FILTER (
      WHERE status IN ('pending', 'overdue')
        AND NOT (status = 'verifying' OR (has_pending_receipt AND status <> 'paid'))
    )::int,
    count(*) FILTER (
      WHERE status = 'verifying' OR (has_pending_receipt AND status <> 'paid')
    )::int,
    COALESCE(sum(amount), 0),
    COALESCE(sum(amount) FILTER (WHERE status = 'paid'), 0)
  INTO v_invoice_count, v_paid_count, v_pending_count, v_review_count, v_expected, v_collected
  FROM month_invoices;

  SELECT count(DISTINCT e.user_id)::int INTO v_opened
  FROM public.user_events e
  WHERE e.created_at >= p_week_start AND e.created_at <= p_week_end
    AND e.entity = 'section:payments';

  SELECT count(*)::int INTO v_checkouts
  FROM public.user_events e
  WHERE e.created_at >= p_week_start AND e.created_at <= p_week_end
    AND e.entity IN (
      'monthly_payment_flow_checkout_started',
      'monthly_payment_mercadopago_checkout_started'
    );

  SELECT CASE WHEN v_parents = 0 THEN 0 ELSE LEAST(100, ROUND(100.0 * count(DISTINCT e.user_id) / v_parents)::int) END
  INTO v_parent_percent
  FROM public.user_events e
  JOIN public.profiles p ON p.id = e.user_id AND p.role::text = 'parent'
  WHERE e.event_type::text = 'session_start'
    AND e.created_at >= p_week_start AND e.created_at <= p_week_end;

  SELECT COALESCE(jsonb_agg(pct ORDER BY idx), '[]'::jsonb) INTO v_percents
  FROM (
    SELECT
      i AS idx,
      CASE
        WHEN v_parents = 0 THEN 0
        ELSE LEAST(100, ROUND(100.0 * (
          SELECT count(DISTINCT e.user_id)
          FROM public.user_events e
          JOIN public.profiles p ON p.id = e.user_id AND p.role::text = 'parent'
          WHERE e.event_type::text = 'session_start'
            AND e.created_at >= p_week_start - ((3 - i) * interval '7 days')
            AND e.created_at <= p_week_end - ((3 - i) * interval '7 days')
        ) / v_parents)::int)
      END AS pct
    FROM generate_series(0, 3) AS i
  ) weeks;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'firstName', first_name,
      'lastName', last_name,
      'sessions', sessions
    ) ORDER BY sessions DESC, last_name
  ), '[]'::jsonb) INTO v_top
  FROM (
    SELECT COALESCE(p.first_name, '') AS first_name, COALESCE(p.last_name, '') AS last_name, count(*)::int AS sessions
    FROM public.user_events e
    JOIN public.profiles p ON p.id = e.user_id AND p.role::text = 'parent'
    WHERE e.event_type::text = 'session_start'
      AND e.created_at >= p_week_start AND e.created_at <= p_week_end
    GROUP BY p.id, p.first_name, p.last_name
    ORDER BY count(*) DESC, p.last_name
    LIMIT 3
  ) top_parents;

  SELECT COALESCE(jsonb_agg(cnt ORDER BY dow), '[0,0,0,0,0,0,0]'::jsonb) INTO v_weekdays
  FROM (
    SELECT d AS dow, (
      SELECT count(*)::int
      FROM public.user_events e
      WHERE e.event_type::text = 'session_start'
        AND e.created_at >= p_week_start AND e.created_at <= p_week_end
        AND ((EXTRACT(dow FROM e.created_at AT TIME ZONE p_tz)::int + 6) % 7) = d
    ) AS cnt
    FROM generate_series(0, 6) AS d
  ) days;

  SELECT count(DISTINCT se.section_id)::int INTO v_marked
  FROM public.section_attendance sa
  JOIN public.section_enrollments se ON se.id = sa.enrollment_id
  WHERE sa.attended_on >= (p_week_start AT TIME ZONE p_tz)::date
    AND sa.attended_on <= (p_week_end AT TIME ZONE p_tz)::date;

  SELECT count(DISTINCT section_id)::int INTO v_sections
  FROM public.section_enrollments
  WHERE status::text = 'active';

  SELECT count(*)::int INTO v_tasks_due
  FROM public.task_instances ti
  WHERE ti.archived_at IS NULL
    AND ti.due_at >= p_week_start AND ti.due_at <= p_week_end;

  SELECT count(*)::int INTO v_tasks_open
  FROM public.task_instances ti
  WHERE ti.archived_at IS NULL
    AND ti.due_at >= p_week_start AND ti.due_at <= p_week_end
    AND EXISTS (
      SELECT 1 FROM public.section_enrollments se
      WHERE se.section_id = ti.section_id
        AND se.status::text = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM public.student_task_progress sp
          WHERE sp.task_instance_id = ti.id
            AND sp.enrollment_id = se.id
            AND sp.status::text IN ('COMPLETED', 'COMPLETED_LATE')
        )
    );

  SELECT count(*)::int INTO v_registrations
  FROM public.registrations
  WHERE created_at >= p_week_start AND created_at <= p_week_end;

  SELECT count(*)::int INTO v_events
  FROM public.event_attendees
  WHERE created_at >= p_week_start AND created_at <= p_week_end;

  SELECT count(DISTINCT user_id)::int INTO v_sessions
  FROM public.user_events
  WHERE event_type::text = 'session_start'
    AND created_at >= p_week_start AND created_at <= p_week_end;

  SELECT count(*)::int INTO v_views
  FROM public.user_events
  WHERE event_type::text = 'page_view'
    AND created_at >= p_week_start AND created_at <= p_week_end
    AND (
      entity IN ('section:blog', 'section:events')
      OR entity LIKE '%/blog%'
      OR entity LIKE '%/events%'
    );

  RETURN jsonb_build_object(
    'pendingReceipts', v_pending_receipts,
    'openParentMessages', v_open_messages,
    'silentFamilies', v_silent,
    'tuition', jsonb_build_object(
      'invoiceCount', v_invoice_count,
      'paidCount', v_paid_count,
      'pendingCount', v_pending_count,
      'inReviewCount', v_review_count,
      'expectedAmount', v_expected,
      'collectedAmount', v_collected
    ),
    'funnel', jsonb_build_object(
      'invoices', v_invoice_count,
      'openedPayments', v_opened,
      'checkoutsStarted', v_checkouts,
      'paidInvoices', v_paid_count
    ),
    'parentPercent', v_parent_percent,
    'parentPercents', v_percents,
    'topParents', v_top,
    'weekdaySessions', v_weekdays,
    'attendanceMarkedSections', v_marked,
    'attendanceSections', v_sections,
    'tasksIncomplete', v_tasks_open,
    'tasksDue', v_tasks_due,
    'registrations', v_registrations,
    'eventEnrollments', v_events,
    'signedInSessions', v_sessions,
    'publicPageViews', v_views
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_weekly_digest(timestamptz, timestamptz, date, date, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_weekly_digest(timestamptz, timestamptz, date, date, timestamptz, text) TO service_role;
