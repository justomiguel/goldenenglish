-- Public NPS + website-improvement questionnaire. Idempotent: skips if the slug exists
-- or if there is no admin profile to own created_by.

BEGIN;

DO $$
DECLARE
  admin_id uuid;
  q_id uuid := 'a11c0000-0000-4000-8000-000000000205';
BEGIN
  IF to_regclass('public.questionnaires') IS NULL THEN
    RAISE NOTICE 'questionnaires table missing; skip NPS seed';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.questionnaires
    WHERE slug = 'nps-experiencia-web'
      AND archived_at IS NULL
  ) THEN
    RETURN;
  END IF;

  SELECT p.id
  INTO admin_id
  FROM public.profiles p
  WHERE p.role = 'admin'
  ORDER BY p.created_at
  LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'no admin profile; skip NPS seed';
    RETURN;
  END IF;

  INSERT INTO public.questionnaires (
    id,
    slug,
    title_i18n,
    description_i18n,
    status,
    visibility,
    limit_one_response,
    show_on_landing,
    created_by,
    published_at
  ) VALUES (
    q_id,
    'nps-experiencia-web',
    '{"es":"Tu opinión sobre la web"}'::jsonb,
    '{"es":"Nos ayuda a mejorar el sitio y la experiencia online del instituto. Toma menos de dos minutos."}'::jsonb,
    'published',
    'public',
    true,
    true,
    admin_id,
    now()
  );

  INSERT INTO public.questionnaire_questions (
    questionnaire_id, question_type, prompt_i18n, options_i18n, required, position
  ) VALUES
    (
      q_id,
      'single_choice',
      '{"es":"¿Qué tan probable es que recomiendes este sitio a un amigo o colega?"}'::jsonb,
      '{"es":["0","1","2","3","4","5","6","7","8","9","10"]}'::jsonb,
      true,
      0
    ),
    (
      q_id,
      'yes_no',
      '{"es":"¿Te gusta esta web?"}'::jsonb,
      '{}'::jsonb,
      true,
      1
    ),
    (
      q_id,
      'textarea',
      '{"es":"¿Qué es lo que más te gusta?"}'::jsonb,
      '{}'::jsonb,
      false,
      2
    ),
    (
      q_id,
      'textarea',
      '{"es":"¿Qué le agregarías o cambiarías?"}'::jsonb,
      '{}'::jsonb,
      true,
      3
    ),
    (
      q_id,
      'textarea',
      '{"es":"¿Cómo te imaginás una experiencia online de este instituto?"}'::jsonb,
      '{}'::jsonb,
      true,
      4
    ),
    (
      q_id,
      'yes_no',
      '{"es":"¿Ya estás tomando clases o actividades online?"}'::jsonb,
      '{}'::jsonb,
      true,
      5
    ),
    (
      q_id,
      'textarea',
      '{"es":"Si ya estás online, ¿qué te faltaría para complementar esa experiencia?"}'::jsonb,
      '{}'::jsonb,
      false,
      6
    );
END $$;

COMMIT;
