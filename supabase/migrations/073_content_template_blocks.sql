-- Block-based authoring for global content templates.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_template_block_kind') THEN
    CREATE TYPE public.content_template_block_kind AS ENUM (
      'text',
      'file',
      'video_embed',
      'audio',
      'image',
      'pdf',
      'quiz',
      'external_link',
      'divider'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.content_templates') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS public.content_template_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id UUID NOT NULL REFERENCES public.content_templates (id) ON DELETE CASCADE,
      asset_id UUID NULL REFERENCES public.content_template_assets (id) ON DELETE SET NULL,
      kind public.content_template_block_kind NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS content_template_blocks_template_order_idx
      ON public.content_template_blocks (template_id, sort_order, created_at);

    DROP TRIGGER IF EXISTS content_template_blocks_set_updated_at ON public.content_template_blocks;
    CREATE TRIGGER content_template_blocks_set_updated_at
      BEFORE UPDATE ON public.content_template_blocks
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    ALTER TABLE public.content_template_blocks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS content_template_blocks_select_staff ON public.content_template_blocks;
    CREATE POLICY content_template_blocks_select_staff ON public.content_template_blocks
      FOR SELECT TO authenticated
      USING (public.learning_task_template_staff_can_read(auth.uid()));

    DROP POLICY IF EXISTS content_template_blocks_write_staff ON public.content_template_blocks;
    CREATE POLICY content_template_blocks_write_staff ON public.content_template_blocks
      FOR ALL TO authenticated
      USING (public.learning_task_template_staff_can_read(auth.uid()))
      WITH CHECK (public.learning_task_template_staff_can_read(auth.uid()));
  END IF;
END $$;
