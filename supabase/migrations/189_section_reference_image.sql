-- Optional section photo for enrollment-link share previews and identity surfaces.
-- Spec: docs/superpowers/specs/2026-08-25-section-enrollment-link-slug-and-share-design.md

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS reference_image_path TEXT;

COMMENT ON COLUMN public.academic_sections.reference_image_path IS
  'Object path in the section-images bucket. Null when the section has no photo.';

DROP FUNCTION IF EXISTS public.resolve_section_enrollment_link(uuid);

CREATE FUNCTION public.resolve_section_enrollment_link(p_token uuid)
RETURNS TABLE (
  section_id UUID,
  section_name TEXT,
  cohort_name TEXT,
  schedule_slots JSONB,
  seats_remaining INT,
  reference_image_path TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    c.name,
    s.schedule_slots,
    CASE
      WHEN s.max_students IS NULL THEN NULL
      ELSE GREATEST(
        s.max_students - (
          SELECT count(*)
          FROM public.section_enrollments se
          WHERE se.section_id = s.id
            AND se.status = 'active'
        ),
        0
      )::INT
    END,
    s.reference_image_path
  FROM public.section_enrollment_links l
  INNER JOIN public.academic_sections s ON s.id = l.section_id
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE l.token = p_token
    AND l.is_active = true
    AND s.archived_at IS NULL
    AND c.archived_at IS NULL
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolve_section_enrollment_link(uuid) IS
  'Section behind a public enrollment link token, or no rows when the link is inactive, archived or unknown.';

REVOKE ALL ON FUNCTION public.resolve_section_enrollment_link(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_section_enrollment_link(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_section_enrollment_link(uuid) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('section-images', 'section-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS section_images_select_public ON storage.objects;
CREATE POLICY section_images_select_public
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'section-images');

DROP POLICY IF EXISTS section_images_insert_admin ON storage.objects;
CREATE POLICY section_images_insert_admin
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'section-images'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS section_images_update_admin ON storage.objects;
CREATE POLICY section_images_update_admin
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'section-images'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS section_images_delete_admin ON storage.objects;
CREATE POLICY section_images_delete_admin
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'section-images'
    AND public.is_admin(auth.uid())
  );
