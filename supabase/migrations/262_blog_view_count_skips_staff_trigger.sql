-- Public view counts must not pass the staff content trigger.
-- Migration 187 revoked UPDATE on blog_articles from anon.
-- Do not grant that privilege back. Anon would be able to edit every column.
--
-- The increment function is SECURITY DEFINER, but auth.uid() stays the caller.
-- blog_articles_validate_transitions then raises blog_update_forbidden.
-- A transaction-local flag lets only this function skip that check.
-- A view must not change updated_at.

CREATE OR REPLACE FUNCTION public.blog_articles_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('blog.view_increment', true) = '1' THEN
    RETURN NEW;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.blog_articles_validate_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin_role boolean := public.is_admin(auth.uid());
  is_assistant_role boolean := public.user_has_role(auth.uid(), 'assistant');
  is_teacher_role boolean := public.user_has_role(auth.uid(), 'teacher');
BEGIN
  IF TG_OP = 'UPDATE' AND current_setting('blog.view_increment', true) = '1' THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION public.increment_blog_article_view_count(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('blog.view_increment', '1', true);

  UPDATE public.blog_articles
  SET view_count = view_count + 1
  WHERE id = p_article_id
    AND status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_article_view_count(uuid) TO anon, authenticated;
