-- Portal calendar: persistent iCal subscription token on profiles; optional room label on sections (admin master calendar filter).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calendar_feed_token UUID NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_calendar_feed_token_uidx
  ON public.profiles (calendar_feed_token)
  WHERE calendar_feed_token IS NOT NULL;

COMMENT ON COLUMN public.profiles.calendar_feed_token IS
  'Opaque token for GET /api/calendar/feed/[token].ics (subscription). Rotatable; never treat as secret beyond unlisted URL.';

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS room_label TEXT NULL;

COMMENT ON COLUMN public.academic_sections.room_label IS
  'Optional classroom / room name for admin scheduling views and calendar filters.';
