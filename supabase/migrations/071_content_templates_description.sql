-- Add a short repository description to global content templates.
DO $$
BEGIN
  IF to_regclass('public.content_templates') IS NOT NULL THEN
    ALTER TABLE public.content_templates
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
  END IF;
END $$;
