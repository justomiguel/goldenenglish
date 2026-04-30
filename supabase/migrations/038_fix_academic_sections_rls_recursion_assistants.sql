-- Break RLS recursion: academic_sections SELECT referenced academic_section_assistants,
-- whose SELECT policy queried academic_sections again (42P17 infinite recursion).

CREATE OR REPLACE FUNCTION public.user_is_section_lead_teacher(p_uid uuid, p_section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academic_sections s
    WHERE s.id = p_section_id
      AND s.teacher_id = p_uid
  );
$$;

COMMENT ON FUNCTION public.user_is_section_lead_teacher(uuid, uuid) IS
  'True if p_uid is the section lead (teacher_id). SECURITY DEFINER to avoid RLS recursion with academic_section_assistants policies.';

GRANT EXECUTE ON FUNCTION public.user_is_section_lead_teacher(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS academic_section_assistants_select_scope ON public.academic_section_assistants;
CREATE POLICY academic_section_assistants_select_scope ON public.academic_section_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR assistant_id = auth.uid()
    OR public.user_is_section_lead_teacher(auth.uid(), section_id)
  );

DROP POLICY IF EXISTS academic_section_external_assistants_select_scope
  ON public.academic_section_external_assistants;
CREATE POLICY academic_section_external_assistants_select_scope
  ON public.academic_section_external_assistants
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.user_is_section_lead_teacher(auth.uid(), section_id)
    OR EXISTS (
      SELECT 1 FROM public.academic_section_assistants a
      WHERE a.section_id = section_id AND a.assistant_id = auth.uid()
    )
  );
