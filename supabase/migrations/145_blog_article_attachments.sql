-- Blog article translation attachments (files + embeds), same contract as academic global content materials.

ALTER TABLE public.blog_article_translations
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.blog_article_translations
  DROP CONSTRAINT IF EXISTS blog_article_translations_attachments_is_array;

ALTER TABLE public.blog_article_translations
  ADD CONSTRAINT blog_article_translations_attachments_is_array
  CHECK (jsonb_typeof(attachments) = 'array');

COMMENT ON COLUMN public.blog_article_translations.attachments IS
  'Ordered list of { kind: file|embed, label, url?, storagePath?, filename?, contentType?, byteSize?, sortOrder }.';
