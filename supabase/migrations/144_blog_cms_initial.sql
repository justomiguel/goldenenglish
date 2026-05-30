-- Blog/CMS foundation (multi-locale, moderation workflow, comments, search).
-- Version 144: 136 is reserved by admin_users_directory_exclude_site_contact (applied first on remote).
-- Tenant scope follows deployment scope (no tenant_id columns).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'blog_article_status'
  ) THEN
    CREATE TYPE public.blog_article_status AS ENUM (
      'draft',
      'pending_review',
      'scheduled',
      'published',
      'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'blog_comment_status'
  ) THEN
    CREATE TYPE public.blog_comment_status AS ENUM (
      'visible',
      'hidden',
      'flagged'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.blog_user_is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_admin(uid)
    OR public.user_has_role(uid, 'assistant')
    OR public.user_has_role(uid, 'teacher')
  );
$$;

COMMENT ON FUNCTION public.blog_user_is_staff(uuid) IS
  'SECURITY DEFINER: blog writer role (admin, assistant, teacher).';

CREATE OR REPLACE FUNCTION public.blog_user_can_review(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_admin(uid)
    OR public.user_has_role(uid, 'assistant')
  );
$$;

COMMENT ON FUNCTION public.blog_user_can_review(uuid) IS
  'SECURITY DEFINER: reviewers for moderation queues (admin, assistant).';

CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_locale TEXT NOT NULL CHECK (default_locale IN ('en', 'es', 'pt')),
  status public.blog_article_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ NULL,
  scheduled_for TIMESTAMPTZ NULL,
  cover_storage_path TEXT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_at TIMESTAMPTZ NULL,
  comments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  view_count INT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT blog_articles_schedule_requires_date
    CHECK (status <> 'scheduled' OR scheduled_for IS NOT NULL),
  CONSTRAINT blog_articles_published_requires_date
    CHECK (status <> 'published' OR published_at IS NOT NULL),
  CONSTRAINT blog_articles_tags_max_30
    CHECK (coalesce(array_length(tags, 1), 0) <= 30)
);

CREATE TABLE IF NOT EXISTS public.blog_article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'es', 'pt')),
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  excerpt TEXT NOT NULL DEFAULT '' CHECK (char_length(excerpt) <= 280),
  body_html TEXT NOT NULL DEFAULT '' CHECK (length(trim(body_html)) > 0),
  body_text_plain TEXT NOT NULL DEFAULT '',
  reading_time_minutes INT NOT NULL DEFAULT 1 CHECK (reading_time_minutes >= 1),
  seo_title TEXT NULL,
  seo_description TEXT NULL CHECK (
    seo_description IS NULL OR char_length(seo_description) <= 320
  ),
  tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(body_text_plain, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blog_article_translations_article_locale_unique
    UNIQUE (article_id, locale),
  CONSTRAINT blog_article_translations_locale_slug_unique
    UNIQUE (locale, slug)
);

CREATE TABLE IF NOT EXISTS public.blog_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID NULL REFERENCES public.blog_article_comments(id) ON DELETE CASCADE,
  body_text TEXT NOT NULL CHECK (
    char_length(trim(body_text)) >= 1 AND char_length(body_text) <= 2000
  ),
  status public.blog_comment_status NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.blog_article_comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NULL CHECK (reason IS NULL OR char_length(reason) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blog_comment_reports_unique_reporter
    UNIQUE (comment_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS blog_articles_status_published_idx
  ON public.blog_articles (status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS blog_articles_scheduled_idx
  ON public.blog_articles (scheduled_for)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS blog_articles_author_idx
  ON public.blog_articles (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS blog_articles_tags_gin_idx
  ON public.blog_articles
  USING GIN (tags);

CREATE INDEX IF NOT EXISTS blog_articles_pinned_idx
  ON public.blog_articles (pinned_at DESC NULLS LAST)
  WHERE is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS blog_article_translations_article_idx
  ON public.blog_article_translations (article_id, locale);

CREATE INDEX IF NOT EXISTS blog_article_translations_tsv_gin_idx
  ON public.blog_article_translations
  USING GIN (tsv);

CREATE INDEX IF NOT EXISTS blog_comments_article_idx
  ON public.blog_article_comments (article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS blog_comments_author_idx
  ON public.blog_article_comments (author_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.blog_articles_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_articles_set_updated_at ON public.blog_articles;
CREATE TRIGGER blog_articles_set_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_articles_set_updated_at();

CREATE OR REPLACE FUNCTION public.blog_article_translations_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_article_translations_set_updated_at ON public.blog_article_translations;
CREATE TRIGGER blog_article_translations_set_updated_at
  BEFORE UPDATE ON public.blog_article_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_article_translations_set_updated_at();

CREATE OR REPLACE FUNCTION public.blog_article_comments_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_article_comments_set_updated_at ON public.blog_article_comments;
CREATE TRIGGER blog_article_comments_set_updated_at
  BEFORE UPDATE ON public.blog_article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_article_comments_set_updated_at();

CREATE OR REPLACE FUNCTION public.blog_articles_validate_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin_role boolean := public.is_admin(auth.uid());
  is_assistant_role boolean := public.user_has_role(auth.uid(), 'assistant');
  is_teacher_role boolean := public.user_has_role(auth.uid(), 'teacher');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.blog_user_is_staff(auth.uid()) THEN
      RAISE EXCEPTION 'blog_not_allowed_writer';
    END IF;
    IF NEW.author_id <> auth.uid() AND NOT (is_admin_role OR is_assistant_role) THEN
      RAISE EXCEPTION 'blog_author_mismatch';
    END IF;
    IF NEW.status <> 'draft' AND NOT (is_admin_role OR is_assistant_role) THEN
      RAISE EXCEPTION 'blog_insert_draft_required';
    END IF;
    RETURN NEW;
  END IF;

  IF NOT (is_admin_role OR is_assistant_role OR (is_teacher_role AND NEW.author_id = auth.uid())) THEN
    RAISE EXCEPTION 'blog_update_forbidden';
  END IF;

  IF is_teacher_role AND NOT (is_admin_role OR is_assistant_role) THEN
    IF NEW.status = 'published' OR NEW.status = 'archived' THEN
      RAISE EXCEPTION 'blog_teacher_cannot_publish_or_archive';
    END IF;
  END IF;

  IF NEW.status = 'published' AND NOT (is_admin_role OR is_assistant_role) THEN
    RAISE EXCEPTION 'blog_publish_requires_reviewer';
  END IF;

  IF NEW.status = 'archived' AND NOT (is_admin_role OR is_assistant_role) THEN
    RAISE EXCEPTION 'blog_archive_requires_reviewer';
  END IF;

  IF OLD.status = 'published' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'blog_invalid_status_rewind';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_articles_validate_transitions ON public.blog_articles;
CREATE TRIGGER blog_articles_validate_transitions
  BEFORE INSERT OR UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_articles_validate_transitions();

CREATE OR REPLACE FUNCTION public.blog_comments_validate_parent_depth()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_parent_id UUID;
  parent_article_id UUID;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT parent_comment_id, article_id
  INTO parent_parent_id, parent_article_id
  FROM public.blog_article_comments
  WHERE id = NEW.parent_comment_id;

  IF parent_article_id IS NULL THEN
    RAISE EXCEPTION 'blog_comment_parent_not_found';
  END IF;

  IF parent_article_id <> NEW.article_id THEN
    RAISE EXCEPTION 'blog_comment_parent_article_mismatch';
  END IF;

  IF parent_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'blog_comment_depth_exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_comments_validate_parent_depth ON public.blog_article_comments;
CREATE TRIGGER blog_comments_validate_parent_depth
  BEFORE INSERT OR UPDATE ON public.blog_article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_comments_validate_parent_depth();

CREATE OR REPLACE FUNCTION public.blog_comments_rate_limit_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*)::INT
    INTO recent_count
  FROM public.blog_article_comments c
  WHERE c.author_id = NEW.author_id
    AND c.created_at >= now() - interval '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'blog_comment_rate_limited';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_article_view_count(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_articles
  SET view_count = view_count + 1
  WHERE id = p_article_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_article_view_count(uuid) TO anon, authenticated;

DROP TRIGGER IF EXISTS blog_comments_rate_limit_insert ON public.blog_article_comments;
CREATE TRIGGER blog_comments_rate_limit_insert
  BEFORE INSERT ON public.blog_article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_comments_rate_limit_insert();

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_articles_select_published ON public.blog_articles;
CREATE POLICY blog_articles_select_published ON public.blog_articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());

DROP POLICY IF EXISTS blog_articles_select_staff ON public.blog_articles;
CREATE POLICY blog_articles_select_staff ON public.blog_articles
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'assistant')
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS blog_articles_insert_staff ON public.blog_articles;
CREATE POLICY blog_articles_insert_staff ON public.blog_articles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.blog_user_is_staff(auth.uid())
    AND (author_id = auth.uid() OR public.blog_user_can_review(auth.uid()))
  );

DROP POLICY IF EXISTS blog_articles_update_staff ON public.blog_articles;
CREATE POLICY blog_articles_update_staff ON public.blog_articles
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'assistant')
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND author_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'assistant')
    OR (
      public.user_has_role(auth.uid(), 'teacher')
      AND author_id = auth.uid()
      AND status <> 'published'
      AND status <> 'archived'
    )
  );

DROP POLICY IF EXISTS blog_articles_delete_admin ON public.blog_articles;
CREATE POLICY blog_articles_delete_admin ON public.blog_articles
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

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
    )
  );

DROP POLICY IF EXISTS blog_article_translations_select_staff ON public.blog_article_translations;
CREATE POLICY blog_article_translations_select_staff ON public.blog_article_translations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND (
          public.is_admin(auth.uid())
          OR public.user_has_role(auth.uid(), 'assistant')
          OR (
            public.user_has_role(auth.uid(), 'teacher')
            AND a.author_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS blog_article_translations_insert_staff ON public.blog_article_translations;
CREATE POLICY blog_article_translations_insert_staff ON public.blog_article_translations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND (
          public.is_admin(auth.uid())
          OR public.user_has_role(auth.uid(), 'assistant')
          OR (
            public.user_has_role(auth.uid(), 'teacher')
            AND a.author_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS blog_article_translations_update_staff ON public.blog_article_translations;
CREATE POLICY blog_article_translations_update_staff ON public.blog_article_translations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND (
          public.is_admin(auth.uid())
          OR public.user_has_role(auth.uid(), 'assistant')
          OR (
            public.user_has_role(auth.uid(), 'teacher')
            AND a.author_id = auth.uid()
            AND a.status <> 'published'
            AND a.status <> 'archived'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND (
          public.is_admin(auth.uid())
          OR public.user_has_role(auth.uid(), 'assistant')
          OR (
            public.user_has_role(auth.uid(), 'teacher')
            AND a.author_id = auth.uid()
            AND a.status <> 'published'
            AND a.status <> 'archived'
          )
        )
    )
  );

DROP POLICY IF EXISTS blog_article_translations_delete_admin ON public.blog_article_translations;
CREATE POLICY blog_article_translations_delete_admin ON public.blog_article_translations
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'assistant')
  );

DROP POLICY IF EXISTS blog_comments_select_scope ON public.blog_article_comments;
CREATE POLICY blog_comments_select_scope ON public.blog_article_comments
  FOR SELECT TO authenticated
  USING (
    status = 'visible'
    OR author_id = auth.uid()
    OR public.blog_user_can_review(auth.uid())
  );

DROP POLICY IF EXISTS blog_comments_insert_authenticated ON public.blog_article_comments;
CREATE POLICY blog_comments_insert_authenticated ON public.blog_article_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.blog_articles a
      WHERE a.id = article_id
        AND a.status = 'published'
        AND a.published_at IS NOT NULL
        AND a.published_at <= now()
        AND a.comments_enabled = TRUE
    )
  );

DROP POLICY IF EXISTS blog_comments_update_scope ON public.blog_article_comments;
CREATE POLICY blog_comments_update_scope ON public.blog_article_comments
  FOR UPDATE TO authenticated
  USING (
    public.blog_user_can_review(auth.uid())
    OR (
      author_id = auth.uid()
      AND created_at >= now() - interval '5 minutes'
    )
  )
  WITH CHECK (
    public.blog_user_can_review(auth.uid())
    OR (
      author_id = auth.uid()
      AND created_at >= now() - interval '5 minutes'
      AND status = 'visible'
    )
  );

DROP POLICY IF EXISTS blog_comments_delete_scope ON public.blog_article_comments;
CREATE POLICY blog_comments_delete_scope ON public.blog_article_comments
  FOR DELETE TO authenticated
  USING (
    public.blog_user_can_review(auth.uid())
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS blog_comment_reports_select_reviewers ON public.blog_comment_reports;
CREATE POLICY blog_comment_reports_select_reviewers ON public.blog_comment_reports
  FOR SELECT TO authenticated
  USING (public.blog_user_can_review(auth.uid()));

DROP POLICY IF EXISTS blog_comment_reports_insert_authenticated ON public.blog_comment_reports;
CREATE POLICY blog_comment_reports_insert_authenticated ON public.blog_comment_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS blog_comment_reports_delete_reviewers ON public.blog_comment_reports;
CREATE POLICY blog_comment_reports_delete_reviewers ON public.blog_comment_reports
  FOR DELETE TO authenticated
  USING (public.blog_user_can_review(auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS blog_media_select_public ON storage.objects;
CREATE POLICY blog_media_select_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-media');

DROP POLICY IF EXISTS blog_media_insert_staff ON storage.objects;
CREATE POLICY blog_media_insert_staff ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blog-media'
    AND public.blog_user_is_staff(auth.uid())
  );

DROP POLICY IF EXISTS blog_media_update_staff ON storage.objects;
CREATE POLICY blog_media_update_staff ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'blog-media'
    AND public.blog_user_is_staff(auth.uid())
  );

DROP POLICY IF EXISTS blog_media_delete_staff ON storage.objects;
CREATE POLICY blog_media_delete_staff ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'blog-media'
    AND public.blog_user_is_staff(auth.uid())
  );

INSERT INTO public.site_settings (key, value)
VALUES ('blog_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES (
  'google_translation_credentials',
  '{"apiKey":null,"updatedAt":null,"updatedBy":null}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS site_settings_select_blog_public ON public.site_settings;
CREATE POLICY site_settings_select_blog_public ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'blog_enabled');
