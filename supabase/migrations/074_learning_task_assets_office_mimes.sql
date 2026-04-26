-- Allow Microsoft Office files in the learning content asset bucket.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'learning-task-assets') THEN
    UPDATE storage.buckets
    SET allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/webp',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/webm'
    ]::text[]
    WHERE id = 'learning-task-assets';
  END IF;
END $$;
