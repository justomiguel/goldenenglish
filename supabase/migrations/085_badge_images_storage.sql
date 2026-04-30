-- Storage bucket for admin-managed badge images shown in the public share preview.
-- Mirrors the pattern from 046_site_themes.sql (landing-media bucket).
-- Public read so OG image / share page can render without signed URLs.
-- Admin-only write/delete via storage.objects RLS.

INSERT INTO storage.buckets (id, name, public)
VALUES ('badge-images', 'badge-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS badge_images_select_public ON storage.objects;
CREATE POLICY badge_images_select_public
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'badge-images');

DROP POLICY IF EXISTS badge_images_insert_admin ON storage.objects;
CREATE POLICY badge_images_insert_admin
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'badge-images'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS badge_images_update_admin ON storage.objects;
CREATE POLICY badge_images_update_admin
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'badge-images'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS badge_images_delete_admin ON storage.objects;
CREATE POLICY badge_images_delete_admin
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'badge-images'
    AND public.is_admin(auth.uid())
  );
