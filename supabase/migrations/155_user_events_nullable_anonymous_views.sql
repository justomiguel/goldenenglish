-- Public blog/event view telemetry dedupes anonymous browsers via sessionKey in
-- metadata. Server-side inserts use service_role and may omit user_id.

ALTER TABLE public.user_events
  ALTER COLUMN user_id DROP NOT NULL;

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
  IF r IS NULL OR r <> 'student' THEN
    RETURN NEW;
  END IF;
  IF NEW.event_type = 'session_start' THEN
    UPDATE public.profiles
    SET last_session_start_at = NEW.created_at,
        churn_notified_at = NULL
    WHERE id = NEW.user_id;
  END IF;
  IF NEW.event_type = 'page_view' AND NEW.entity LIKE 'material:%' THEN
    UPDATE public.profiles
    SET engagement_points = engagement_points + 5
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
