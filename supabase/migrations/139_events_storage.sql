BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('event-uploads', 'event-uploads', false, 26214400)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS event_uploads_select_owner_or_admin ON storage.objects;
CREATE POLICY event_uploads_select_owner_or_admin ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-uploads'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.event_attendees ea
        WHERE (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
          AND ea.id = ((storage.foldername(name))[2])::uuid
          AND (ea.user_id = auth.uid() OR ea.tutor_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS event_uploads_insert_admin ON storage.objects;
CREATE POLICY event_uploads_insert_admin ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-uploads'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_uploads_update_admin ON storage.objects;
CREATE POLICY event_uploads_update_admin ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-uploads'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_uploads_delete_admin ON storage.objects;
CREATE POLICY event_uploads_delete_admin ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-uploads'
    AND public.is_admin(auth.uid())
  );

COMMIT;
