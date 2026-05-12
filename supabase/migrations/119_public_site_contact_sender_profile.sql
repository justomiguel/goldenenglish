-- System profile + auth user used as portal_messages.sender_id for public "contact us"
-- form submissions (service-role inserts). Not for interactive login.
-- Depends on 118_public_site_contact_sender.sql (user_role.site_contact committed).

DO $$
DECLARE
  v_id uuid := '6f0e8c8a-7b1d-4c2e-9f3a-8e5d2c1b0a99'::uuid;
  v_email text := 'site-contact-sender@internal.invalid';
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_password text := 'do-not-login-site-contact-sender-placeholder';
  v_meta jsonb := jsonb_build_object(
    'first_name', 'Site',
    'last_name', 'contact form',
    'dni_or_passport', ''
  );
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
    UPDATE public.profiles
    SET
      role = 'site_contact'::public.user_role,
      first_name = 'Site',
      last_name = 'contact form',
      dni_or_passport = NULL,
      updated_at = now()
    WHERE id = v_id;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1) THEN
    RAISE EXCEPTION 'auth user email collision for site contact sender: %', v_email;
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    is_sso_user,
    is_anonymous,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_id,
    v_instance,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    false,
    false,
    '{"provider":"email","providers":["email"]}'::jsonb,
    v_meta,
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(v_email)),
    'email',
    v_id::text,
    now(),
    now(),
    now()
  );

  UPDATE public.profiles
  SET
    role = 'site_contact'::public.user_role,
    first_name = 'Site',
    last_name = 'contact form',
    dni_or_passport = NULL,
    updated_at = now()
  WHERE id = v_id;
END;
$$;
