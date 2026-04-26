-- Route Graph Studio: directed route edges and evaluable checkpoints.

ALTER TABLE public.learning_route_steps
  ADD COLUMN IF NOT EXISTS position_x NUMERIC(8, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y NUMERIC(8, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.learning_route_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_route_id UUID NOT NULL REFERENCES public.learning_routes (id) ON DELETE CASCADE,
  from_step_id UUID NOT NULL REFERENCES public.learning_route_steps (id) ON DELETE CASCADE,
  to_step_id UUID NOT NULL REFERENCES public.learning_route_steps (id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  condition_kind TEXT NOT NULL DEFAULT 'default',
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_route_edges_no_self_loop CHECK (from_step_id <> to_step_id),
  CONSTRAINT learning_route_edges_unique_pair UNIQUE (learning_route_id, from_step_id, to_step_id)
);

CREATE TABLE IF NOT EXISTS public.learning_route_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_route_edge_id UUID NOT NULL UNIQUE REFERENCES public.learning_route_edges (id) ON DELETE CASCADE,
  assessment_id UUID NULL REFERENCES public.learning_assessments (id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  blocks_progress BOOLEAN NOT NULL DEFAULT FALSE,
  contributes_to_gradebook BOOLEAN NOT NULL DEFAULT FALSE,
  max_score NUMERIC(6, 2) NULL CHECK (max_score IS NULL OR max_score > 0),
  passing_score NUMERIC(6, 2) NULL CHECK (passing_score IS NULL OR passing_score >= 0),
  weight NUMERIC(6, 2) NULL CHECK (weight IS NULL OR weight >= 0),
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_route_checkpoints_gradebook_priority CHECK (
    contributes_to_gradebook = FALSE OR is_priority = TRUE
  )
);

CREATE INDEX IF NOT EXISTS learning_route_edges_route_order_idx
  ON public.learning_route_edges (learning_route_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS learning_route_edges_from_step_idx
  ON public.learning_route_edges (from_step_id);
CREATE INDEX IF NOT EXISTS learning_route_edges_to_step_idx
  ON public.learning_route_edges (to_step_id);
CREATE INDEX IF NOT EXISTS learning_route_checkpoints_gradebook_idx
  ON public.learning_route_checkpoints (contributes_to_gradebook, is_priority);

DROP TRIGGER IF EXISTS learning_route_edges_set_updated_at ON public.learning_route_edges;
CREATE TRIGGER learning_route_edges_set_updated_at BEFORE UPDATE ON public.learning_route_edges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS learning_route_checkpoints_set_updated_at ON public.learning_route_checkpoints;
CREATE TRIGGER learning_route_checkpoints_set_updated_at BEFORE UPDATE ON public.learning_route_checkpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.delete_orphan_learning_route_checkpoint_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.assessment_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.learning_route_checkpoints c
       WHERE c.assessment_id = OLD.assessment_id
         AND c.id <> OLD.id
     ) THEN
    DELETE FROM public.learning_assessments
    WHERE id = OLD.assessment_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS learning_route_checkpoints_delete_assessment ON public.learning_route_checkpoints;
CREATE TRIGGER learning_route_checkpoints_delete_assessment
  AFTER DELETE ON public.learning_route_checkpoints
  FOR EACH ROW EXECUTE FUNCTION public.delete_orphan_learning_route_checkpoint_assessment();

ALTER TABLE public.learning_route_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_route_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learning_route_edges_select_scope ON public.learning_route_edges;
DROP POLICY IF EXISTS learning_route_edges_write_staff ON public.learning_route_edges;
CREATE POLICY learning_route_edges_select_scope ON public.learning_route_edges FOR SELECT TO authenticated
  USING (public.learning_route_visible_to_current_user(learning_route_id));
CREATE POLICY learning_route_edges_write_staff ON public.learning_route_edges FOR ALL TO authenticated
  USING (public.learning_route_staff_can_manage_route(auth.uid(), learning_route_id))
  WITH CHECK (
    updated_by = auth.uid()
    AND public.learning_route_staff_can_manage_route(auth.uid(), learning_route_id)
  );

DROP POLICY IF EXISTS learning_route_checkpoints_select_scope ON public.learning_route_checkpoints;
DROP POLICY IF EXISTS learning_route_checkpoints_write_staff ON public.learning_route_checkpoints;
CREATE POLICY learning_route_checkpoints_select_scope ON public.learning_route_checkpoints FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.learning_route_edges e
      WHERE e.id = learning_route_edge_id
        AND public.learning_route_visible_to_current_user(e.learning_route_id)
    )
  );
CREATE POLICY learning_route_checkpoints_write_staff ON public.learning_route_checkpoints FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.learning_route_edges e
      WHERE e.id = learning_route_edge_id
        AND public.learning_route_staff_can_manage_route(auth.uid(), e.learning_route_id)
    )
  )
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.learning_route_edges e
      WHERE e.id = learning_route_edge_id
        AND public.learning_route_staff_can_manage_route(auth.uid(), e.learning_route_id)
    )
  );
