-- Allow first-run wizard to provision the initial admin via trusted metadata (greenfield).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dni TEXT;
  v_role public.user_role;
  v_role_raw TEXT;
  v_provision TEXT;
BEGIN
  v_dni := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'dni_or_passport', '')), '');
  IF v_dni IS NULL THEN
    v_dni := 'pending-' || replace(NEW.id::text, '-', '');
  END IF;

  v_provision := COALESCE(NEW.raw_user_meta_data ->> 'provisioning_source', '');
  v_role_raw := lower(nullif(trim(COALESCE(NEW.raw_user_meta_data ->> 'role', '')), ''));

  IF v_provision = 'admin_invite'
     AND v_role_raw IN ('admin', 'teacher', 'student', 'parent', 'assistant') THEN
    v_role := v_role_raw::public.user_role;
  ELSIF v_provision = 'bootstrap_wizard'
        AND v_role_raw = 'admin' THEN
    v_role := 'admin'::public.user_role;
  ELSE
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (
    id, role, first_name, last_name, dni_or_passport, phone, birth_date
  )
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), '—'),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), '—'),
    v_dni,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'birth_date', '')), '')::date
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auth trigger: provision profile; admin_invite sets roles; bootstrap_wizard may create first admin (089).';
