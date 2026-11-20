-- One visit or question open per visitor and UTC day. No name, email, or IP.

CREATE TABLE IF NOT EXISTS public.faq_metric_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('visit', 'open')),
  question_id text NULL,
  day date NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'visit' AND question_id IS NULL)
    OR (
      kind = 'open'
      AND question_id IN (
        'price',
        'programs',
        'age',
        'schedule',
        'babies',
        'online',
        'inPerson',
        'where',
        'instruments',
        'enroll',
        'siblings',
        'trial',
        'parents',
        'materials',
        'whatsapp',
        'inclusion'
      )
    )
  )
);

CREATE INDEX IF NOT EXISTS faq_metric_events_created_at_idx
  ON public.faq_metric_events (created_at);

ALTER TABLE public.faq_metric_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.faq_metric_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_faq_metric(
  p_kind text,
  p_question_id text,
  p_dedupe_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids text[] := ARRAY[
    'price',
    'programs',
    'age',
    'schedule',
    'babies',
    'online',
    'inPerson',
    'where',
    'instruments',
    'enroll',
    'siblings',
    'trial',
    'parents',
    'materials',
    'whatsapp',
    'inclusion'
  ];
BEGIN
  IF p_dedupe_key IS NULL OR char_length(btrim(p_dedupe_key)) = 0 THEN
    RETURN;
  END IF;

  IF p_kind = 'visit' THEN
    IF p_question_id IS NOT NULL THEN
      RETURN;
    END IF;
  ELSIF p_kind = 'open' THEN
    IF p_question_id IS NULL OR NOT (p_question_id = ANY (v_ids)) THEN
      RETURN;
    END IF;
  ELSE
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.faq_metric_events (kind, question_id, day, dedupe_key)
    VALUES (
      p_kind,
      p_question_id,
      (now() AT TIME ZONE 'utc')::date,
      p_dedupe_key
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN;
  END;
END;
$$;

COMMENT ON FUNCTION public.record_faq_metric(text, text, text) IS
  'SECURITY DEFINER: one FAQ visit or open. Ignores a duplicate dedupe_key. Drops an unknown question id.';

REVOKE ALL ON FUNCTION public.record_faq_metric(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_faq_metric(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.faq_admin_stats_30d()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'visits',
    (
      SELECT count(*)::int
      FROM public.faq_metric_events e
      WHERE e.kind = 'visit'
        AND e.created_at >= now() - interval '30 days'
    ),
    'opens',
    coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object('questionId', q.question_id, 'count', q.opens)
          ORDER BY q.opens DESC, q.question_id
        )
        FROM (
          SELECT e.question_id, count(*)::int AS opens
          FROM public.faq_metric_events e
          WHERE e.kind = 'open'
            AND e.created_at >= now() - interval '30 days'
          GROUP BY e.question_id
        ) q
      ),
      '[]'::jsonb
    )
  );
END;
$$;

COMMENT ON FUNCTION public.faq_admin_stats_30d() IS
  'SECURITY DEFINER: 30-day FAQ visit total and open counts. Returns null for a non-admin.';

REVOKE ALL ON FUNCTION public.faq_admin_stats_30d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.faq_admin_stats_30d() FROM anon;
GRANT EXECUTE ON FUNCTION public.faq_admin_stats_30d() TO authenticated;
