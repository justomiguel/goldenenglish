-- Learning task core: master templates, section instances, student progress.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_asset_kind') THEN
    CREATE TYPE public.content_asset_kind AS ENUM ('file', 'embed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_embed_provider') THEN
    CREATE TYPE public.content_embed_provider AS ENUM ('youtube', 'vimeo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_progress_status') THEN
    CREATE TYPE public.task_progress_status AS ENUM ('NOT_OPENED', 'OPENED', 'COMPLETED', 'COMPLETED_LATE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  body_html TEXT NOT NULL CHECK (char_length(body_html) BETWEEN 1 AND 80000),
  archived_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.content_templates (id) ON DELETE CASCADE,
  kind public.content_asset_kind NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 180),
  storage_path TEXT NULL,
  mime_type TEXT NULL,
  byte_size BIGINT NULL CHECK (byte_size IS NULL OR byte_size BETWEEN 1 AND 52428800),
  embed_provider public.content_embed_provider NULL,
  embed_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_template_assets_shape CHECK (
    (kind = 'file' AND storage_path IS NOT NULL AND mime_type IS NOT NULL AND byte_size IS NOT NULL
      AND embed_provider IS NULL AND embed_url IS NULL)
    OR
    (kind = 'embed' AND storage_path IS NULL AND mime_type IS NULL AND byte_size IS NULL
      AND embed_provider IS NOT NULL AND embed_url IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NULL REFERENCES public.content_templates (id) ON DELETE SET NULL,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  body_html TEXT NOT NULL CHECK (char_length(body_html) BETWEEN 1 AND 80000),
  start_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_instances_due_after_start CHECK (due_at >= start_at)
);

CREATE TABLE IF NOT EXISTS public.task_instance_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id UUID NOT NULL REFERENCES public.task_instances (id) ON DELETE CASCADE,
  template_asset_id UUID NULL REFERENCES public.content_template_assets (id) ON DELETE SET NULL,
  kind public.content_asset_kind NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 180),
  storage_path TEXT NULL,
  mime_type TEXT NULL,
  byte_size BIGINT NULL CHECK (byte_size IS NULL OR byte_size BETWEEN 1 AND 52428800),
  embed_provider public.content_embed_provider NULL,
  embed_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_instance_assets_shape CHECK (
    (kind = 'file' AND storage_path IS NOT NULL AND mime_type IS NOT NULL AND byte_size IS NOT NULL
      AND embed_provider IS NULL AND embed_url IS NULL)
    OR
    (kind = 'embed' AND storage_path IS NULL AND mime_type IS NULL AND byte_size IS NULL
      AND embed_provider IS NOT NULL AND embed_url IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.student_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id UUID NOT NULL REFERENCES public.task_instances (id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.task_progress_status NOT NULL DEFAULT 'NOT_OPENED',
  opened_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_task_progress_uidx UNIQUE (task_instance_id, enrollment_id),
  CONSTRAINT student_task_progress_completion_shape CHECK (
    (status IN ('COMPLETED', 'COMPLETED_LATE') AND completed_at IS NOT NULL AND opened_at IS NOT NULL)
    OR (status = 'OPENED' AND opened_at IS NOT NULL AND completed_at IS NULL)
    OR (status = 'NOT_OPENED' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS content_templates_list_idx
  ON public.content_templates (archived_at NULLS FIRST, updated_at DESC);
CREATE INDEX IF NOT EXISTS content_template_assets_template_idx
  ON public.content_template_assets (template_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS task_instances_section_due_idx
  ON public.task_instances (section_id, archived_at, due_at DESC);
CREATE INDEX IF NOT EXISTS task_instance_assets_instance_idx
  ON public.task_instance_assets (task_instance_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS student_task_progress_student_status_idx
  ON public.student_task_progress (student_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS student_task_progress_task_status_idx
  ON public.student_task_progress (task_instance_id, status);

DROP TRIGGER IF EXISTS content_templates_set_updated_at ON public.content_templates;
CREATE TRIGGER content_templates_set_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS task_instances_set_updated_at ON public.task_instances;
CREATE TRIGGER task_instances_set_updated_at
  BEFORE UPDATE ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS student_task_progress_set_updated_at ON public.student_task_progress;
CREATE TRIGGER student_task_progress_set_updated_at
  BEFORE UPDATE ON public.student_task_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.learning_task_staff_can_manage_section(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid) OR public.user_leads_or_assists_section(p_uid, p_section_id);
$$;

CREATE OR REPLACE FUNCTION public.learning_task_template_staff_can_read(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.is_admin(p_uid) OR public.user_has_role(p_uid, 'teacher');
$$;

CREATE OR REPLACE FUNCTION public.learning_task_instance_visible_to_current_user(p_task_instance_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_instances ti
    JOIN public.section_enrollments e ON e.section_id = ti.section_id
    WHERE ti.id = p_task_instance_id
      AND (
        public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
        OR e.student_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
        )
      )
  );
$$;

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_task_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_templates_select_staff ON public.content_templates;
CREATE POLICY content_templates_select_staff ON public.content_templates
  FOR SELECT TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()));

DROP POLICY IF EXISTS content_templates_write_staff ON public.content_templates;
CREATE POLICY content_templates_write_staff ON public.content_templates
  FOR ALL TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()))
  WITH CHECK (public.learning_task_template_staff_can_read(auth.uid()) AND updated_by = auth.uid());

DROP POLICY IF EXISTS content_template_assets_select_staff ON public.content_template_assets;
CREATE POLICY content_template_assets_select_staff ON public.content_template_assets
  FOR SELECT TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()));

DROP POLICY IF EXISTS content_template_assets_write_staff ON public.content_template_assets;
CREATE POLICY content_template_assets_write_staff ON public.content_template_assets
  FOR ALL TO authenticated
  USING (public.learning_task_template_staff_can_read(auth.uid()))
  WITH CHECK (public.learning_task_template_staff_can_read(auth.uid()));

DROP POLICY IF EXISTS task_instances_select_scope ON public.task_instances;
CREATE POLICY task_instances_select_scope ON public.task_instances
  FOR SELECT TO authenticated
  USING (public.learning_task_instance_visible_to_current_user(id));

DROP POLICY IF EXISTS task_instances_write_staff ON public.task_instances;
CREATE POLICY task_instances_write_staff ON public.task_instances
  FOR ALL TO authenticated
  USING (public.learning_task_staff_can_manage_section(auth.uid(), section_id))
  WITH CHECK (public.learning_task_staff_can_manage_section(auth.uid(), section_id) AND updated_by = auth.uid());

DROP POLICY IF EXISTS task_instance_assets_select_scope ON public.task_instance_assets;
CREATE POLICY task_instance_assets_select_scope ON public.task_instance_assets
  FOR SELECT TO authenticated
  USING (public.learning_task_instance_visible_to_current_user(task_instance_id));

DROP POLICY IF EXISTS task_instance_assets_write_staff ON public.task_instance_assets;
CREATE POLICY task_instance_assets_write_staff ON public.task_instance_assets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = task_instance_assets.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = task_instance_assets.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  );

DROP POLICY IF EXISTS student_task_progress_select_scope ON public.student_task_progress;
CREATE POLICY student_task_progress_select_scope ON public.student_task_progress
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.learning_task_instance_visible_to_current_user(task_instance_id)
  );

DROP POLICY IF EXISTS student_task_progress_student_update ON public.student_task_progress;
CREATE POLICY student_task_progress_student_update ON public.student_task_progress
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS student_task_progress_staff_insert ON public.student_task_progress;
CREATE POLICY student_task_progress_staff_insert ON public.student_task_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.task_instances ti
      WHERE ti.id = student_task_progress.task_instance_id
        AND public.learning_task_staff_can_manage_section(auth.uid(), ti.section_id)
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'learning-task-assets',
  'learning-task-assets',
  FALSE,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']::text[];

DROP POLICY IF EXISTS learning_task_assets_staff_write ON storage.objects;
CREATE POLICY learning_task_assets_staff_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'learning-task-assets' AND public.learning_task_template_staff_can_read(auth.uid()))
  WITH CHECK (bucket_id = 'learning-task-assets' AND public.learning_task_template_staff_can_read(auth.uid()));
