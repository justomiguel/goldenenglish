DO $$
BEGIN
  ALTER TYPE public.user_event_type ADD VALUE IF NOT EXISTS 'event';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
