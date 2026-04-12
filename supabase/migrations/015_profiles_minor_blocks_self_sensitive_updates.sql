-- Block self-service updates to sensitive profile fields for minors who have a tutor link.
-- Tutor/parent updates remain governed by RLS (e.g. 014). Login email lives in auth.users and is not covered here.

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
  THEN
    RAISE EXCEPTION 'minor_profile_self_edit_forbidden'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_z_block_minor_self_sensitive_update ON public.profiles;
CREATE TRIGGER profiles_z_block_minor_self_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_block_minor_self_sensitive_update();

COMMENT ON FUNCTION public.profiles_block_minor_self_sensitive_update() IS
  'Runs after profiles_set_age_years (name z > s): prevents linked minors from changing identity fields on their own row.';
