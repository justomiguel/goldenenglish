BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_attendee_status') THEN
    CREATE TYPE public.event_attendee_status AS ENUM ('pending_payment', 'confirmed', 'waitlist', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_payment_status') THEN
    CREATE TYPE public.event_payment_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_form_field_type') THEN
    CREATE TYPE public.event_form_field_type AS ENUM (
      'text',
      'textarea',
      'number',
      'date',
      'email',
      'phone',
      'select',
      'file',
      'image'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  section_id UUID NULL REFERENCES public.academic_sections (id) ON DELETE SET NULL,
  private_to_section BOOLEAN NOT NULL DEFAULT false,
  capacity INT NOT NULL CHECK (capacity > 0),
  price NUMERIC(12, 2) NULL CHECK (price IS NULL OR price >= 0),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (char_length(currency) BETWEEN 3 AND 8),
  status public.event_status NOT NULL DEFAULT 'draft',
  default_locale TEXT NOT NULL DEFAULT 'es' CHECK (default_locale IN ('es', 'en', 'pt')),
  cover_image_path TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_status_event_date_idx
  ON public.events (status, event_date);
CREATE INDEX IF NOT EXISTS events_archived_idx
  ON public.events (archived_at);
CREATE INDEX IF NOT EXISTS events_section_idx
  ON public.events (section_id)
  WHERE section_id IS NOT NULL;

DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;
CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type public.event_form_field_type NOT NULL,
  label_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  help_text_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  options_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  required BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  max_file_size_bytes INT NOT NULL DEFAULT 26214400 CHECK (max_file_size_bytes BETWEEN 1 AND 26214400),
  allowed_mime_types TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_form_fields_event_key_unique UNIQUE (event_id, field_key)
);

CREATE INDEX IF NOT EXISTS event_form_fields_event_position_idx
  ON public.event_form_fields (event_id, position, created_at);

DROP TRIGGER IF EXISTS event_form_fields_set_updated_at ON public.event_form_fields;
CREATE TRIGGER event_form_fields_set_updated_at
  BEFORE UPDATE ON public.event_form_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  tutor_id UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni_or_passport TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  status public.event_attendee_status NOT NULL DEFAULT 'confirmed',
  source TEXT NOT NULL DEFAULT 'public' CHECK (source IN ('public', 'logged_in', 'admin_manual')),
  tutor_first_name TEXT,
  tutor_last_name TEXT,
  tutor_dni_or_passport TEXT,
  tutor_email TEXT,
  tutor_phone TEXT,
  tutor_relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_attendees_event_dni_unique UNIQUE (event_id, dni_or_passport)
);

CREATE INDEX IF NOT EXISTS event_attendees_event_status_idx
  ON public.event_attendees (event_id, status, created_at);
CREATE INDEX IF NOT EXISTS event_attendees_user_id_idx
  ON public.event_attendees (user_id)
  WHERE user_id IS NOT NULL;

DROP TRIGGER IF EXISTS event_attendees_set_updated_at ON public.event_attendees;
CREATE TRIGGER event_attendees_set_updated_at
  BEFORE UPDATE ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_attendee_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES public.event_attendees (id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.event_form_fields (id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_date DATE,
  file_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_attendee_field_values_unique UNIQUE (attendee_id, field_id),
  CONSTRAINT event_attendee_field_values_one_value CHECK (
    (
      CASE WHEN value_text IS NULL THEN 0 ELSE 1 END +
      CASE WHEN value_number IS NULL THEN 0 ELSE 1 END +
      CASE WHEN value_date IS NULL THEN 0 ELSE 1 END +
      CASE WHEN file_storage_path IS NULL THEN 0 ELSE 1 END
    ) <= 1
  )
);

CREATE INDEX IF NOT EXISTS event_attendee_field_values_attendee_idx
  ON public.event_attendee_field_values (attendee_id);

CREATE TABLE IF NOT EXISTS public.event_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_attendee_id UUID NOT NULL UNIQUE REFERENCES public.event_attendees (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL CHECK (char_length(currency) BETWEEN 3 AND 8),
  status public.event_payment_status NOT NULL DEFAULT 'pending',
  gateway_provider TEXT CHECK (gateway_provider IS NULL OR gateway_provider IN ('flow', 'mercadopago')),
  mp_preference_id TEXT,
  receipt_storage_path TEXT,
  receipt_uploaded_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  review_notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_payments_status_idx
  ON public.event_payments (status, created_at);
CREATE INDEX IF NOT EXISTS event_payments_gateway_provider_idx
  ON public.event_payments (gateway_provider);

DROP TRIGGER IF EXISTS event_payments_set_updated_at ON public.event_payments;
CREATE TRIGGER event_payments_set_updated_at
  BEFORE UPDATE ON public.event_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_payment_flow_finalize_records (
  event_payment_id UUID PRIMARY KEY REFERENCES public.event_payments (id) ON DELETE CASCADE,
  flow_order BIGINT NOT NULL,
  commerce_order TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (char_length(currency) BETWEEN 3 AND 8),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ NOT NULL,
  payer_email TEXT,
  media_label TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_payment_flow_finalize_records_flow_order_idx
  ON public.event_payment_flow_finalize_records (flow_order);

DROP TRIGGER IF EXISTS event_payment_flow_finalize_records_set_updated_at ON public.event_payment_flow_finalize_records;
CREATE TRIGGER event_payment_flow_finalize_records_set_updated_at
  BEFORE UPDATE ON public.event_payment_flow_finalize_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_payment_mp_finalize_records (
  event_payment_id UUID PRIMARY KEY REFERENCES public.event_payments (id) ON DELETE CASCADE,
  mp_payment_id BIGINT NOT NULL,
  mp_preference_id TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (char_length(currency) BETWEEN 3 AND 8),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ NOT NULL,
  payer_email TEXT,
  payment_method TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_payment_mp_finalize_records_mp_payment_id_idx
  ON public.event_payment_mp_finalize_records (mp_payment_id);

DROP TRIGGER IF EXISTS event_payment_mp_finalize_records_set_updated_at ON public.event_payment_mp_finalize_records;
CREATE TRIGGER event_payment_mp_finalize_records_set_updated_at
  BEFORE UPDATE ON public.event_payment_mp_finalize_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.events IS
  'Public/admin events with optional section scope and optional paid registration.';
COMMENT ON TABLE public.event_form_fields IS
  'Per-event dynamic registration form schema with i18n labels/help/options.';
COMMENT ON TABLE public.event_attendees IS
  'One attendee row per event and identity document.';
COMMENT ON TABLE public.event_payments IS
  'Event registration payments (gateway or transfer receipt approval workflow).';

COMMIT;
