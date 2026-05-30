-- Public event detail view counter (mirrors blog_articles.view_count pattern).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_event_view_count(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET view_count = view_count + 1
  WHERE id = p_event_id
    AND status = 'published'
    AND archived_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_event_view_count(uuid) TO anon, authenticated;
