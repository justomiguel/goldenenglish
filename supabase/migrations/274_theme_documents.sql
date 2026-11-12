-- Published and draft theme documents. Additive. Existing themes stay on legacy columns.

CREATE TABLE IF NOT EXISTS public.theme_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_theme_id uuid NOT NULL REFERENCES public.site_themes (id) ON DELETE CASCADE,
  status text NOT NULL,
  version int NOT NULL DEFAULT 0,
  document jsonb NOT NULL,
  document_hash text NOT NULL,
  based_on_id uuid REFERENCES public.theme_documents (id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid,
  published_at timestamptz,
  CONSTRAINT theme_documents_status_check CHECK (status IN ('draft', 'published', 'superseded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS theme_documents_one_draft
  ON public.theme_documents (site_theme_id)
  WHERE status = 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS theme_documents_one_published
  ON public.theme_documents (site_theme_id)
  WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.theme_documents_block_snapshot_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF old.status IN ('published', 'superseded')
     AND new.document IS DISTINCT FROM old.document THEN
    RAISE EXCEPTION 'snapshot_immutable' USING ERRCODE = 'P0001';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS theme_documents_block_snapshot_edit ON public.theme_documents;
CREATE TRIGGER theme_documents_block_snapshot_edit
  BEFORE UPDATE ON public.theme_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.theme_documents_block_snapshot_edit();

ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS published_document_id uuid REFERENCES public.theme_documents (id);

ALTER TABLE public.theme_documents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.theme_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.theme_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.theme_documents TO authenticated;

DROP POLICY IF EXISTS theme_documents_admin_select ON public.theme_documents;
CREATE POLICY theme_documents_admin_select ON public.theme_documents
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS theme_documents_admin_insert ON public.theme_documents;
CREATE POLICY theme_documents_admin_insert ON public.theme_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS theme_documents_admin_update ON public.theme_documents;
CREATE POLICY theme_documents_admin_update ON public.theme_documents
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) AND status = 'draft')
  WITH CHECK (public.is_admin(auth.uid()) AND status = 'draft');

DROP POLICY IF EXISTS theme_documents_admin_delete ON public.theme_documents;
CREATE POLICY theme_documents_admin_delete ON public.theme_documents
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) AND status = 'draft');

CREATE OR REPLACE FUNCTION public.get_published_theme_document(p_site_theme_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT document
  FROM public.theme_documents
  WHERE site_theme_id = p_site_theme_id
    AND status = 'published'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_theme_document(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_theme_document(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.publish_theme_document(
  p_site_theme_id uuid,
  p_expected_hash text
) RETURNS TABLE (id uuid, version int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_draft public.theme_documents%ROWTYPE;
  v_next int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_draft
  FROM public.theme_documents
  WHERE site_theme_id = p_site_theme_id
    AND status = 'draft'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'draft_missing' USING ERRCODE = 'P0001';
  END IF;

  IF v_draft.document_hash IS DISTINCT FROM p_expected_hash THEN
    RAISE EXCEPTION 'document_stale' USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(max(d.version), 0) + 1 INTO v_next
  FROM public.theme_documents d
  WHERE d.site_theme_id = p_site_theme_id;

  UPDATE public.theme_documents
  SET status = 'superseded'
  WHERE site_theme_id = p_site_theme_id
    AND status = 'published';

  UPDATE public.theme_documents
  SET status = 'published',
      version = v_next,
      published_by = auth.uid(),
      published_at = now()
  WHERE theme_documents.id = v_draft.id;

  UPDATE public.site_themes
  SET published_document_id = v_draft.id
  WHERE site_themes.id = p_site_theme_id;

  RETURN QUERY SELECT v_draft.id, v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_theme_document(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_theme_document(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rollback_theme_document(
  p_site_theme_id uuid,
  p_snapshot_id uuid
) RETURNS TABLE (id uuid, version int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_source public.theme_documents%ROWTYPE;
  v_next int;
  v_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_source
  FROM public.theme_documents
  WHERE theme_documents.id = p_snapshot_id
    AND site_theme_id = p_site_theme_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'snapshot_not_found' USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(max(d.version), 0) + 1 INTO v_next
  FROM public.theme_documents d
  WHERE d.site_theme_id = p_site_theme_id;

  UPDATE public.theme_documents
  SET status = 'superseded'
  WHERE site_theme_id = p_site_theme_id
    AND status = 'published';

  INSERT INTO public.theme_documents (
    site_theme_id, status, version, document, document_hash, based_on_id, created_by, published_by, published_at
  ) VALUES (
    p_site_theme_id, 'published', v_next, v_source.document, v_source.document_hash, v_source.id, auth.uid(), auth.uid(), now()
  )
  RETURNING theme_documents.id INTO v_id;

  UPDATE public.site_themes
  SET published_document_id = v_id
  WHERE site_themes.id = p_site_theme_id;

  RETURN QUERY SELECT v_id, v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_theme_document(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rollback_theme_document(uuid, uuid) TO authenticated;
