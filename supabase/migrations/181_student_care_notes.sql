-- Student care notes: health, dietary and special-support text that only an
-- admin, the student's tutor, or a teacher/assistant of one of the student's
-- sections may read. The three note texts are removed from the API roles with
-- a column-privilege allowlist; `has_care_notes` stays readable so staff lists
-- can show a marker without exposing anything.
-- Spec: docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md (3.7, D12, D13)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_health_note  TEXT,
  ADD COLUMN IF NOT EXISTS care_diet_note    TEXT,
  ADD COLUMN IF NOT EXISTS care_support_note TEXT,
  ADD COLUMN IF NOT EXISTS care_updated_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS care_updated_by   UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_care_notes    BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.care_health_note IS
  'Restricted: health condition staff must know about. Read only through loadStudentCareNotes.';
COMMENT ON COLUMN public.profiles.care_diet_note IS
  'Restricted: dietary needs or allergies. Read only through loadStudentCareNotes.';
COMMENT ON COLUMN public.profiles.care_support_note IS
  'Restricted: special treatment or accommodation. Read only through loadStudentCareNotes.';
COMMENT ON COLUMN public.profiles.has_care_notes IS
  'Derived by trigger: true when any care note is non-blank. Deliberately unrestricted (D13).';

-- Derived flag, same pattern as profiles_set_age_years (migration 011).
CREATE OR REPLACE FUNCTION public.profiles_set_has_care_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.has_care_notes :=
    COALESCE(btrim(NEW.care_health_note), '')     <> ''
    OR COALESCE(btrim(NEW.care_diet_note), '')    <> ''
    OR COALESCE(btrim(NEW.care_support_note), '') <> '';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_has_care_notes ON public.profiles;
CREATE TRIGGER profiles_set_has_care_notes
  BEFORE INSERT OR UPDATE OF care_health_note, care_diet_note, care_support_note
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_has_care_notes();

-- Backfill. Every row is false today, but re-firing the trigger keeps the
-- migration correct if it is ever replayed against data that already has notes.
UPDATE public.profiles
  SET care_health_note = care_health_note
  WHERE care_health_note IS NOT NULL
     OR care_diet_note IS NOT NULL
     OR care_support_note IS NOT NULL;

-- A linked minor already cannot edit their own identity fields; care notes join
-- that list. Replaces the version from migration 111. The trigger
-- profiles_z_block_minor_self_sensitive_update is BEFORE UPDATE on every column,
-- so it already fires for these and is not recreated here.
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
    OR (NEW.care_health_note IS DISTINCT FROM OLD.care_health_note)
    OR (NEW.care_diet_note IS DISTINCT FROM OLD.care_diet_note)
    OR (NEW.care_support_note IS DISTINCT FROM OLD.care_support_note)
  THEN
    RAISE EXCEPTION 'minor_profile_self_edit_forbidden'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.profiles_block_minor_self_sensitive_update() IS
  'Blocks a linked minor from self-editing identity, address and care-note columns.';

-- Column privileges. RLS is per row, so it cannot hide three columns; column
-- privileges are the only mechanism and they are not subtractive. Migration 166
-- granted table-level SELECT to both API roles, so narrowing means revoking that
-- and re-granting an explicit allowlist of every OTHER column.
--
-- DANGER: migration 166 also left ALTER DEFAULT PRIVILEGES ... GRANT ALL ON
-- TABLES, and any future migration repeating GRANT ALL ON ALL TABLES IN SCHEMA
-- public would silently re-open these three columns. The guard test
-- src/__tests__/db/profilesCarePrivilegeAllowlist.test.ts is what enforces both
-- that and the reverse hazard (a new column left out of the list below).
--
-- Only SELECT is narrowed. INSERT / UPDATE / DELETE keep their table-level
-- grants so every existing RLS write policy behaves exactly as before, and
-- service_role is untouched because the authorized loader reads with it.
REVOKE SELECT ON public.profiles FROM authenticated, anon;

GRANT SELECT (
  id,
  role,
  first_name,
  last_name,
  dni_or_passport,
  phone,
  birth_date,
  created_at,
  updated_at,
  age_years,
  assigned_teacher_id,
  avatar_url,
  enrollment_fee_exempt,
  enrollment_exempt_authorized_by,
  enrollment_exempt_at,
  enrollment_exempt_reason,
  last_enrollment_paid_at,
  last_session_start_at,
  churn_notified_at,
  engagement_points,
  is_minor,
  next_exam_at,
  student_portal_next_event_at,
  student_portal_next_event_label,
  billing_adult_transition_pending,
  calendar_feed_token,
  home_address_text,
  home_place_id,
  has_care_notes,
  care_updated_at,
  care_updated_by
) ON public.profiles TO authenticated, anon;
