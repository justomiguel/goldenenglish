-- Residential address on profiles (optional). Supports Google Places selection (place_id) + formatted text.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_address_text TEXT,
  ADD COLUMN IF NOT EXISTS home_place_id TEXT;

COMMENT ON COLUMN public.profiles.home_address_text IS 'Residential address (formatted display); optional.';
COMMENT ON COLUMN public.profiles.home_place_id IS 'Google Place ID when chosen from Places Autocomplete; null if typed manually.';

-- Extend minor self-edit block (migration 015): same rule as other identity-adjacent fields.
CREATE OR REPLACE FUNCTION public.profiles_block_minor_self_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM NEW.id THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM 'student'::public.user_role THEN
    RETURN NEW;
  END IF;

  IF NOT COALESCE(NEW.is_minor, false) THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tutor_student_rel ts
    WHERE ts.student_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  IF (NEW.first_name IS DISTINCT FROM OLD.first_name)
    OR (NEW.last_name IS DISTINCT FROM OLD.last_name)
    OR (NEW.phone IS DISTINCT FROM OLD.phone)
    OR (NEW.birth_date IS DISTINCT FROM OLD.birth_date)
    OR (NEW.dni_or_passport IS DISTINCT FROM OLD.dni_or_passport)
    OR (NEW.home_address_text IS DISTINCT FROM OLD.home_address_text)
    OR (NEW.home_place_id IS DISTINCT FROM OLD.home_place_id)
  THEN
    RAISE EXCEPTION 'minor_profile_self_edit_forbidden'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;
