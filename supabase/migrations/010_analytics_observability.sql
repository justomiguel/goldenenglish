-- Analytics (user_events), engagement, churn fields, immutable system_config_audit.

DO $$
BEGIN
  CREATE TYPE public.user_event_type AS ENUM (
    'page_view',
    'click',
    'action',
    'session_start'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_type public.user_event_type NOT NULL,
  entity TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_events_user_created_idx
  ON public.user_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_type_created_idx
  ON public.user_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_entity_created_idx
  ON public.user_events (entity, created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_session_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS engagement_points INT NOT NULL DEFAULT 0
    CHECK (engagement_points >= 0);

CREATE TABLE IF NOT EXISTS public.system_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_config_audit_created_idx
  ON public.system_config_audit (created_at DESC);

CREATE OR REPLACE FUNCTION public.user_events_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
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

DROP TRIGGER IF EXISTS user_events_engagement ON public.user_events;
CREATE TRIGGER user_events_engagement
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.user_events_after_insert();

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_events_insert_own ON public.user_events;
CREATE POLICY user_events_insert_own ON public.user_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_events_select_admin ON public.user_events;
CREATE POLICY user_events_select_admin ON public.user_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS system_config_audit_admin_select ON public.system_config_audit;
CREATE POLICY system_config_audit_admin_select ON public.system_config_audit
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS system_config_audit_admin_insert ON public.system_config_audit;
CREATE POLICY system_config_audit_admin_insert ON public.system_config_audit
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.admin_analytics_hourly_by_role(p_days int)
RETURNS TABLE (hour int, role text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM ue.created_at AT TIME ZONE 'America/Argentina/Cordoba')::int AS hour,
    p.role::text,
    COUNT(*)::bigint AS cnt
  FROM public.user_events ue
  JOIN public.profiles p ON p.id = ue.user_id
  WHERE ue.created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_analytics_geo(p_days int)
RETURNS TABLE (country text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(ue.metadata->>'geo_country', 'unknown') AS country,
    COUNT(*)::bigint AS cnt
  FROM public.user_events ue
  WHERE ue.created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 40;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_analytics_section_funnel(p_days int)
RETURNS TABLE (section text, viewers bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    ue.entity AS section,
    COUNT(DISTINCT ue.user_id)::bigint AS viewers
  FROM public.user_events ue
  WHERE ue.created_at >= now() - (p_days || ' days')::interval
    AND ue.event_type = 'page_view'
    AND ue.entity LIKE 'section:%'
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 30;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_analytics_hourly_by_role(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_analytics_geo(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_analytics_section_funnel(int) TO authenticated;
