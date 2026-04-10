-- =============================================================================
-- Golden English — admin de desarrollo (ejecutar en Supabase → SQL Editor)
-- =============================================================================
-- Crea: justomiguelvargas@gmail.com / tetas123*-
-- Perfil public.profiles con rol admin (el trigger inicial crea el perfil;
-- luego se actualiza el rol).
--
-- No uses esto en producción ni subas credenciales a un repo público.
-- Idempotente: si el correo ya existe, actualiza contraseña/tokens/instance_id
-- y deja el perfil como admin. Solo usa DELETE si quieres otro id distinto.
--
-- Nota GoTrue: el login busca filas con
--   instance_id = '00000000-0000-0000-0000-000000000000'
--   e is_sso_user = false (NULL cuenta como distinto de false).
-- No uses auth.instances.id como instance_id del usuario.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- DELETE FROM auth.users WHERE email = 'justomiguelvargas@gmail.com';

-- Si ya ejecutaste una versión vieja del seed, corre esto y vuelve a probar login:
-- UPDATE auth.users
-- SET
--   instance_id = '00000000-0000-0000-0000-000000000000'::uuid,
--   is_sso_user = false
-- WHERE lower(email) = lower('justomiguelvargas@gmail.com');

-- GoTrue hace Scan a string no nullable: NULL en confirmation_token (u otros tokens)
-- provoca "Database error querying schema". Normaliza filas sembradas a mano:
-- UPDATE auth.users SET
--   confirmation_token = COALESCE(confirmation_token, ''),
--   recovery_token = COALESCE(recovery_token, ''),
--   email_change = COALESCE(email_change, ''),
--   email_change_token_new = COALESCE(email_change_token_new, ''),
--   email_change_token_current = COALESCE(email_change_token_current, ''),
--   reauthentication_token = COALESCE(reauthentication_token, '')
-- WHERE confirmation_token IS NULL;

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'justomiguelvargas@gmail.com';
  v_password text := 'tetas123*-';
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_meta jsonb := jsonb_build_object(
    'first_name', 'Admin',
    'last_name', 'Golden English',
    'dni_or_passport', 'ADMIN-0001'
  );
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      instance_id = v_instance,
      aud = 'authenticated',
      role = 'authenticated',
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = COALESCE(email_change_token_current, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      is_sso_user = false,
      is_anonymous = false,
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = v_meta,
      updated_at = now()
    WHERE id = v_user_id;

    IF NOT EXISTS (
      SELECT 1 FROM auth.identities i
      WHERE i.user_id = v_user_id AND i.provider = 'email'
    ) THEN
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
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', lower(v_email)),
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    END IF;
  ELSE
    v_user_id := gen_random_uuid();

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
      v_user_id,
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
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', lower(v_email)),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = v_user_id;
END $$;
