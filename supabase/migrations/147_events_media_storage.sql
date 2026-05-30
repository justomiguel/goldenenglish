BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('event-media', 'event-media', TRUE, 26214400)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS event_media_select_public ON storage.objects;
CREATE POLICY event_media_select_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'event-media');

DROP POLICY IF EXISTS event_media_insert_admin ON storage.objects;
CREATE POLICY event_media_insert_admin ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_media_update_admin ON storage.objects;
CREATE POLICY event_media_update_admin ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_media_delete_admin ON storage.objects;
CREATE POLICY event_media_delete_admin ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-media'
    AND public.is_admin(auth.uid())
  );

COMMIT;
