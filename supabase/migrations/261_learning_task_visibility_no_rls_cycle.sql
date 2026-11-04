-- A student opening a task re-enters task_instances RLS forever.
--
-- `task_instances_select_scope` calls `learning_task_instance_visible_to_current_user`.
-- That helper selects `task_instances` as the caller, so the same policy runs again.
-- Postgres then raises `stack depth limit exceeded` (54001). The progress screen
-- hides the task. The predicate stays the same. SECURITY DEFINER stops the cycle.

CREATE OR REPLACE FUNCTION public.learning_task_instance_visible_to_current_user(p_task_instance_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

COMMENT ON FUNCTION public.learning_task_instance_visible_to_current_user(uuid) IS
  'SECURITY DEFINER: same visibility predicate, without re-entering task_instances RLS from its own policy.';

REVOKE ALL ON FUNCTION public.learning_task_instance_visible_to_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.learning_task_instance_visible_to_current_user(uuid) TO authenticated;
