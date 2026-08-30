-- Parent (and any role) last access: session_start stamps last_session_start_at.
-- Student-only: clear churn_notified_at; +5 engagement on material page_view.
-- Mirrors src/lib/analytics/userEventsAfterInsertEffects.ts

CREATE OR REPLACE FUNCTION public.user_events_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role::text INTO r FROM public.profiles WHERE id = NEW.user_id;
  IF r IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.event_type = 'session_start' THEN
    UPDATE public.profiles
    SET last_session_start_at = NEW.created_at,
        churn_notified_at = CASE WHEN r = 'student' THEN NULL ELSE churn_notified_at END
    WHERE id = NEW.user_id;
  END IF;

  IF r = 'student'
     AND NEW.event_type = 'page_view'
     AND NEW.entity LIKE 'material:%' THEN
    UPDATE public.profiles
    SET engagement_points = engagement_points + 5
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.profiles AS p
SET last_session_start_at = src.picked
FROM (
  SELECT
    ue.user_id,
    COALESCE(
      MAX(ue.created_at) FILTER (WHERE ue.event_type = 'session_start'),
      MAX(ue.created_at)
    ) AS picked
  FROM public.user_events AS ue
  WHERE ue.user_id IS NOT NULL
  GROUP BY ue.user_id
) AS src
WHERE p.id = src.user_id
  AND p.role = 'parent'
  AND src.picked IS NOT NULL
  AND (
    p.last_session_start_at IS NULL
    OR p.last_session_start_at < src.picked
  );
