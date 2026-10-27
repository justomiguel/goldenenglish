-- Institute-defined academic fields and one value per student.
-- Archive hides a field. Values stay. File and image cannot be a directory column.

CREATE TABLE IF NOT EXISTS public.academic_profile_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  field_type text NOT NULL,
  select_options text[] NOT NULL DEFAULT '{}',
  required boolean NOT NULL DEFAULT false,
  show_in_directory boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_profile_fields_type_check CHECK (
    field_type IN ('text', 'textarea', 'number', 'date', 'email', 'phone', 'select', 'file', 'image')
  ),
  CONSTRAINT academic_profile_fields_label_check CHECK (char_length(btrim(label)) BETWEEN 1 AND 80),
  CONSTRAINT academic_profile_fields_column_check CHECK (
    show_in_directory = false OR field_type NOT IN ('file', 'image')
  ),
  CONSTRAINT academic_profile_fields_options_check CHECK (
    (field_type = 'select' AND cardinality(select_options) >= 1)
    OR (field_type <> 'select' AND cardinality(select_options) = 0)
  )
);

CREATE TABLE IF NOT EXISTS public.academic_profile_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.academic_profile_fields (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  value_text text,
  value_number numeric,
  value_date date,
  storage_path text,
  updated_by uuid REFERENCES public.profiles (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, student_id)
);

CREATE INDEX IF NOT EXISTS academic_profile_field_values_text_idx
  ON public.academic_profile_field_values (field_id, value_text);
CREATE INDEX IF NOT EXISTS academic_profile_field_values_number_idx
  ON public.academic_profile_field_values (field_id, value_number);
CREATE INDEX IF NOT EXISTS academic_profile_field_values_date_idx
  ON public.academic_profile_field_values (field_id, value_date);

CREATE OR REPLACE FUNCTION public.academic_profile_value_visible(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.section_enrollments e
      JOIN public.academic_sections s ON s.id = e.section_id
      WHERE e.student_id = p_student_id
        AND s.archived_at IS NULL
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.academic_section_assistants a
            WHERE a.section_id = s.id
              AND a.assistant_id = auth.uid()
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.academic_profile_value_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.academic_profile_value_visible(uuid) TO authenticated, service_role;

ALTER TABLE public.academic_profile_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_profile_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_profile_fields_select_staff ON public.academic_profile_fields;
CREATE POLICY academic_profile_fields_select_staff
  ON public.academic_profile_fields
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'assistant')
    )
  );

DROP POLICY IF EXISTS academic_profile_fields_modify_admin ON public.academic_profile_fields;
CREATE POLICY academic_profile_fields_modify_admin
  ON public.academic_profile_fields
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS academic_profile_field_values_staff ON public.academic_profile_field_values;
CREATE POLICY academic_profile_field_values_staff
  ON public.academic_profile_field_values
  FOR ALL TO authenticated
  USING (public.academic_profile_value_visible(student_id))
  WITH CHECK (public.academic_profile_value_visible(student_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_profile_fields TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_profile_field_values TO authenticated, service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('academic-profile-files', 'academic-profile-files', false)
ON CONFLICT (id) DO NOTHING;
