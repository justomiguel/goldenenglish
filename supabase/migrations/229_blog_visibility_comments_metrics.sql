-- Blog hub: article visibility, call to action, guest comment email, and 30-day metrics.
-- Additive. Does not drop tables, columns, or rows.
--
-- The last statement adds blog_comment_status value 'pending'.
-- This file does not use 'pending'. Postgres requires that new value
-- to be committed before any statement uses it.

ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.blog_articles
  DROP CONSTRAINT IF EXISTS blog_articles_visibility_check;

ALTER TABLE public.blog_articles
  ADD CONSTRAINT blog_articles_visibility_check
  CHECK (visibility IN ('public', 'members'));

ALTER TABLE public.blog_article_translations
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text;

ALTER TABLE public.blog_article_translations
  DROP CONSTRAINT IF EXISTS blog_article_translations_cta_pair;

ALTER TABLE public.blog_article_translations
  ADD CONSTRAINT blog_article_translations_cta_pair
  CHECK (
    (cta_label IS NULL AND cta_url IS NULL)
    OR (
      cta_label IS NOT NULL
      AND char_length(trim(cta_label)) BETWEEN 1 AND 80
      AND cta_url IS NOT NULL
      AND char_length(trim(cta_url)) > 0
    )
  );

ALTER TABLE public.blog_article_comments
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.blog_article_comments
  ADD COLUMN IF NOT EXISTS guest_display_name text;

ALTER TABLE public.blog_article_comments
  DROP CONSTRAINT IF EXISTS blog_article_comments_author_shape;

ALTER TABLE public.blog_article_comments
  ADD CONSTRAINT blog_article_comments_author_shape
  CHECK (
    (author_id IS NOT NULL AND guest_display_name IS NULL)
    OR (
      author_id IS NULL
      AND guest_display_name IS NOT NULL
      AND char_length(trim(guest_display_name)) BETWEEN 1 AND 80
    )
  );

CREATE TABLE IF NOT EXISTS public.blog_comment_guest_emails (
  comment_id uuid PRIMARY KEY REFERENCES public.blog_article_comments(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 320)
);

ALTER TABLE public.blog_comment_guest_emails ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.blog_comment_guest_emails FROM anon;

DROP POLICY IF EXISTS blog_comment_guest_emails_reviewer ON public.blog_comment_guest_emails;
CREATE POLICY blog_comment_guest_emails_reviewer
  ON public.blog_comment_guest_emails
  FOR ALL TO authenticated
  USING (public.blog_user_can_review(auth.uid()))
  WITH CHECK (public.blog_user_can_review(auth.uid()));

CREATE TABLE IF NOT EXISTS public.blog_article_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('list_view', 'article_view', 'cta_click')),
  source text NULL CHECK (source IS NULL OR source IN ('index', 'other')),
  day date NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'list_view' AND article_id IS NULL AND source IS NULL)
    OR (kind = 'article_view' AND article_id IS NOT NULL AND source IS NOT NULL)
    OR (kind = 'cta_click' AND article_id IS NOT NULL AND source IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS blog_article_metrics_created_at_idx
  ON public.blog_article_metrics (created_at);

ALTER TABLE public.blog_article_metrics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_article_metrics FROM anon, authenticated;

DROP POLICY IF EXISTS blog_articles_select_published ON public.blog_articles;
CREATE POLICY blog_articles_select_published ON public.blog_articles
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
    AND (
      visibility = 'public'
      OR (auth.uid() IS NOT NULL AND visibility = 'members')
    )
  );

DROP POLICY IF EXISTS blog_article_translations_select_published ON public.blog_article_translations;
CREATE POLICY blog_article_translations_select_published ON public.blog_article_translations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND a.status = 'published'
        AND a.published_at IS NOT NULL
        AND a.published_at <= now()
        AND (
          a.visibility = 'public'
          OR (auth.uid() IS NOT NULL AND a.visibility = 'members')
        )
    )
  );

-- The comment insert policy reads this key. RLS on site_settings would hide it
-- from non-admin roles without a select policy, and the insert check would fail.
DROP POLICY IF EXISTS site_settings_select_blog_comments_public ON public.site_settings;
CREATE POLICY site_settings_select_blog_comments_public ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'blog_comments_enabled');

DROP POLICY IF EXISTS blog_comments_insert_authenticated ON public.blog_article_comments;
CREATE POLICY blog_comments_insert_authenticated ON public.blog_article_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND guest_display_name IS NULL
    AND status = 'visible'
    AND EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND a.status = 'published'
        AND a.published_at IS NOT NULL
        AND a.published_at <= now()
        AND a.comments_enabled = TRUE
    )
    AND EXISTS (
      SELECT 1
      FROM public.site_settings s
      WHERE s.key = 'blog_comments_enabled'
        AND s.value IS DISTINCT FROM 'false'::jsonb
    )
  );

INSERT INTO public.site_settings (key, value)
VALUES ('blog_comments_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('blog_guest_comments_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_blog_metric(
  p_kind text,
  p_article_id uuid,
  p_source text,
  p_dedupe_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.blog_article_status;
  v_published_at timestamptz;
  v_visibility text;
  v_day date;
BEGIN
  IF p_dedupe_key IS NULL OR char_length(btrim(p_dedupe_key)) = 0 THEN
    RETURN;
  END IF;

  IF p_kind = 'list_view' THEN
    IF p_article_id IS NOT NULL OR p_source IS NOT NULL THEN
      RETURN;
    END IF;
  ELSIF p_kind = 'article_view' THEN
    IF p_article_id IS NULL OR p_source IS NULL OR p_source NOT IN ('index', 'other') THEN
      RETURN;
    END IF;
  ELSIF p_kind = 'cta_click' THEN
    IF p_article_id IS NULL OR p_source IS NOT NULL THEN
      RETURN;
    END IF;
  ELSE
    RETURN;
  END IF;

  IF p_kind <> 'list_view' THEN
    SELECT a.status, a.published_at, a.visibility
      INTO v_status, v_published_at, v_visibility
    FROM public.blog_articles a
    WHERE a.id = p_article_id;

    IF NOT FOUND
      OR v_status IS DISTINCT FROM 'published'
      OR v_published_at IS NULL
      OR v_published_at > now() THEN
      RETURN;
    END IF;

    IF auth.uid() IS NULL AND v_visibility = 'members' THEN
      RETURN;
    END IF;

    IF p_kind = 'cta_click' AND NOT EXISTS (
      SELECT 1
      FROM public.blog_article_translations t
      WHERE t.article_id = p_article_id
        AND t.cta_label IS NOT NULL
        AND t.cta_url IS NOT NULL
    ) THEN
      RETURN;
    END IF;
  END IF;

  v_day := (now() AT TIME ZONE 'utc')::date;

  BEGIN
    INSERT INTO public.blog_article_metrics (
      article_id,
      kind,
      source,
      day,
      dedupe_key
    ) VALUES (
      p_article_id,
      p_kind,
      p_source,
      v_day,
      p_dedupe_key
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN;
  END;
END;
$$;

COMMENT ON FUNCTION public.record_blog_metric(text, uuid, text, text) IS
  'SECURITY DEFINER: one blog metric row. Ignores a duplicate dedupe_key. No-ops when the article is not readable or the click has no call to action.';

REVOKE ALL ON FUNCTION public.record_blog_metric(text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_blog_metric(text, uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.blog_admin_stats_30d()
RETURNS SETOF jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.blog_user_can_review(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH windowed_metrics AS (
    SELECT m.article_id, m.kind, m.source
    FROM public.blog_article_metrics m
    WHERE m.created_at >= now() - interval '30 days'
  ),
  windowed_comments AS (
    SELECT c.article_id
    FROM public.blog_article_comments c
    WHERE c.status = 'visible'
      AND c.created_at >= now() - interval '30 days'
  ),
  totals AS (
    SELECT
      count(*) FILTER (WHERE kind = 'article_view')::int AS article_views,
      count(*) FILTER (
        WHERE kind = 'article_view' AND source = 'index'
      )::int AS index_article_views,
      count(*) FILTER (WHERE kind = 'list_view')::int AS list_views
    FROM windowed_metrics
  ),
  article_metric AS (
    SELECT
      article_id,
      count(*) FILTER (WHERE kind = 'article_view')::int AS views,
      count(*) FILTER (WHERE kind = 'cta_click')::int AS cta_clicks
    FROM windowed_metrics
    WHERE article_id IS NOT NULL
    GROUP BY article_id
  ),
  article_comments AS (
    SELECT article_id, count(*)::int AS visible_comments
    FROM windowed_comments
    GROUP BY article_id
  ),
  article_ids AS (
    SELECT article_id FROM article_metric
    UNION
    SELECT article_id FROM article_comments
  )
  SELECT jsonb_build_object(
    'articleViews', coalesce((SELECT article_views FROM totals), 0),
    'indexArticleViews', coalesce((SELECT index_article_views FROM totals), 0),
    'listViews', coalesce((SELECT list_views FROM totals), 0),
    'articles', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'articleId', ids.article_id,
            'views', coalesce(metric.views, 0),
            'ctaClicks', coalesce(metric.cta_clicks, 0),
            'visibleComments', coalesce(comments.visible_comments, 0),
            'hasCta', EXISTS (
              SELECT 1
              FROM public.blog_article_translations t
              WHERE t.article_id = ids.article_id
                AND t.cta_label IS NOT NULL
                AND t.cta_url IS NOT NULL
            )
          )
          ORDER BY coalesce(metric.views, 0) DESC, ids.article_id
        )
        FROM article_ids ids
        LEFT JOIN article_metric metric ON metric.article_id = ids.article_id
        LEFT JOIN article_comments comments ON comments.article_id = ids.article_id
      ),
      '[]'::jsonb
    )
  );
END;
$$;

COMMENT ON FUNCTION public.blog_admin_stats_30d() IS
  'SECURITY DEFINER: 30-day blog stats for reviewers. Returns no rows for other callers.';

REVOKE ALL ON FUNCTION public.blog_admin_stats_30d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.blog_admin_stats_30d() FROM anon;
GRANT EXECUTE ON FUNCTION public.blog_admin_stats_30d() TO authenticated;

ALTER TYPE public.blog_comment_status ADD VALUE IF NOT EXISTS 'pending';
