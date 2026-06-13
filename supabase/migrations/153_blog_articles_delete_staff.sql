-- Allow admin and assistant staff to hard-delete blog articles (translations/comments cascade).

DROP POLICY IF EXISTS blog_articles_delete_admin ON public.blog_articles;

CREATE POLICY blog_articles_delete_staff ON public.blog_articles
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_has_role(auth.uid(), 'assistant')
  );
