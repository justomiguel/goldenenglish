-- Public registration: store date of birth on the lead row.
-- Profiles: snapshot age in years (derived from birth_date on insert/update).

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.registrations.birth_date IS 'Date of birth from public form; used when enrolling the student.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_years INT;

COMMENT ON COLUMN public.profiles.age_years IS 'Age in full years, derived from birth_date when the row is written (not auto-aging daily).';

CREATE OR REPLACE FUNCTION public.profiles_set_age_years()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.birth_date IS NULL THEN
    NEW.age_years := NULL;
  ELSE
    NEW.age_years := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_age_years ON public.profiles;
CREATE TRIGGER profiles_set_age_years
  BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_age_years();

UPDATE public.profiles
SET age_years = EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::integer
WHERE birth_date IS NOT NULL;
