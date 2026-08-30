-- TEMPORAL / MANUAL — solo tenant Nagô.
-- No es una migración: correr a mano en la base de Capoeira Nagô.
--
-- Carga la sede Ñuñoa (Tegualda 1571) con los horarios del flyer
-- "CLASES DE CAPOEIRA - ÑUÑOA" y actualiza el WhatsApp de contacto.
--
-- Idempotente por slug de cohort + nombre de sección.
--
-- Horas de fin no publicadas en el flyer (salvo Baby):
--   Baby / Kids / Mayores → 50 min (Baby es 16:30–17:20).
--   Teens / Mixta / Adultos → 60 min.
--
-- Cuotas según veces por semana del flyer:
--   1× $40.000 … 6× $90.000. Clase de prueba $15.000 CLP.
--
-- dayOfWeek: 0=domingo … 6=sábado.

DO $$
DECLARE
  v_teacher uuid;
  v_cohort uuid;
  v_year int := 2026;
  v_section uuid;
  r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.site_themes
    WHERE template_kind = 'nago'::public.site_theme_kind
  ) THEN
    RAISE EXCEPTION
      'tmp_nunoa_sections_2026.sql es solo para el tenant Nagô (site_themes.template_kind = nago).';
  END IF;

  SELECT p.id
    INTO v_teacher
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'admin')
  ORDER BY
    CASE p.role WHEN 'teacher' THEN 0 ELSE 1 END,
    p.created_at
  LIMIT 1;

  IF v_teacher IS NULL THEN
    RAISE EXCEPTION
      'No hay perfil teacher/admin para asignar como teacher_id de las secciones Ñuñoa.';
  END IF;

  UPDATE public.academic_cohorts
  SET is_current = false
  WHERE is_current
    AND slug IS DISTINCT FROM 'nunoa-2026';

  INSERT INTO public.academic_cohorts (
    name,
    slug,
    starts_on,
    ends_on,
    is_current,
    archived_at,
    default_enrollment_fee_amount,
    default_monthly_fee,
    offers_trial,
    trial_fee_amount
  )
  VALUES (
    'Capoeira Ñuñoa 2026',
    'nunoa-2026',
    make_date(v_year, 1, 1),
    make_date(v_year, 12, 31),
    true,
    NULL,
    0,
    40000,
    true,
    15000
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    starts_on = EXCLUDED.starts_on,
    ends_on = EXCLUDED.ends_on,
    is_current = true,
    archived_at = NULL,
    default_enrollment_fee_amount = EXCLUDED.default_enrollment_fee_amount,
    default_monthly_fee = EXCLUDED.default_monthly_fee,
    offers_trial = EXCLUDED.offers_trial,
    trial_fee_amount = EXCLUDED.trial_fee_amount,
    updated_at = now()
  RETURNING id INTO v_cohort;

  IF v_cohort IS NULL THEN
    SELECT id INTO v_cohort
    FROM public.academic_cohorts
    WHERE slug = 'nunoa-2026';
  END IF;

  FOR r IN
    SELECT *
    FROM (
      VALUES
        (
          'Ñuñoa · Baby (2–3)'::text,
          60000::numeric,
          '[
            {"dayOfWeek":2,"startTime":"16:30","endTime":"17:20"},
            {"dayOfWeek":4,"startTime":"16:30","endTime":"17:20"},
            {"dayOfWeek":6,"startTime":"10:00","endTime":"10:50"}
          ]'::jsonb
        ),
        (
          'Ñuñoa · Kids (4–7)',
          90000,
          '[
            {"dayOfWeek":1,"startTime":"16:30","endTime":"17:20"},
            {"dayOfWeek":2,"startTime":"17:30","endTime":"18:20"},
            {"dayOfWeek":3,"startTime":"16:30","endTime":"17:20"},
            {"dayOfWeek":4,"startTime":"17:30","endTime":"18:20"},
            {"dayOfWeek":5,"startTime":"17:30","endTime":"18:20"},
            {"dayOfWeek":6,"startTime":"11:00","endTime":"11:50"}
          ]'::jsonb
        ),
        (
          'Ñuñoa · Kids (8–10)',
          60000,
          '[
            {"dayOfWeek":1,"startTime":"17:30","endTime":"18:20"},
            {"dayOfWeek":3,"startTime":"17:30","endTime":"18:20"},
            {"dayOfWeek":6,"startTime":"13:00","endTime":"13:50"}
          ]'::jsonb
        ),
        (
          'Ñuñoa · Teens (+13)',
          50000,
          '[
            {"dayOfWeek":4,"startTime":"18:30","endTime":"19:30"},
            {"dayOfWeek":5,"startTime":"18:30","endTime":"19:30"}
          ]'::jsonb
        ),
        (
          'Ñuñoa · Capoeira mixta (12+)',
          50000,
          '[
            {"dayOfWeek":2,"startTime":"18:30","endTime":"19:30"},
            {"dayOfWeek":4,"startTime":"18:30","endTime":"19:30"}
          ]'::jsonb
        ),
        (
          'Ñuñoa · Adultos',
          50000,
          '[
            {"dayOfWeek":2,"startTime":"20:30","endTime":"21:30"},
            {"dayOfWeek":4,"startTime":"20:30","endTime":"21:30"}
          ]'::jsonb
        ),
        (
          'Ñuñoa · Personas mayores (60+)',
          40000,
          '[
            {"dayOfWeek":6,"startTime":"09:00","endTime":"09:50"}
          ]'::jsonb
        )
    ) AS t(name, monthly_fee, slots)
  LOOP
    SELECT s.id
      INTO v_section
    FROM public.academic_sections s
    WHERE s.cohort_id = v_cohort
      AND s.name = r.name
    LIMIT 1;

    IF v_section IS NULL THEN
      INSERT INTO public.academic_sections (
        cohort_id,
        name,
        teacher_id,
        schedule_slots,
        starts_on,
        ends_on,
        room_label,
        enrollment_fee_amount,
        monthly_fee_charge_mode,
        allow_advance_monthly_payment,
        billing_mode,
        offers_trial,
        trial_fee_amount,
        archived_at
      )
      VALUES (
        v_cohort,
        r.name,
        v_teacher,
        r.slots,
        make_date(v_year, 1, 1),
        make_date(v_year, 12, 31),
        'Tegualda 1571, Ñuñoa',
        0,
        'full_month_fee',
        true,
        'section_monthly_fee',
        true,
        15000,
        NULL
      )
      RETURNING id INTO v_section;
    ELSE
      UPDATE public.academic_sections
      SET
        teacher_id = v_teacher,
        schedule_slots = r.slots,
        starts_on = make_date(v_year, 1, 1),
        ends_on = make_date(v_year, 12, 31),
        room_label = 'Tegualda 1571, Ñuñoa',
        enrollment_fee_amount = 0,
        monthly_fee_charge_mode = 'full_month_fee',
        allow_advance_monthly_payment = true,
        billing_mode = 'section_monthly_fee',
        offers_trial = true,
        trial_fee_amount = 15000,
        archived_at = NULL,
        updated_at = now()
      WHERE id = v_section;
    END IF;

    INSERT INTO public.section_fee_plans (
      section_id,
      effective_from_year,
      effective_from_month,
      monthly_fee,
      currency
    )
    VALUES (v_section, v_year, 1, r.monthly_fee, 'CLP')
    ON CONFLICT (section_id, effective_from_year, effective_from_month) DO UPDATE
    SET
      monthly_fee = EXCLUDED.monthly_fee,
      currency = EXCLUDED.currency,
      archived_at = NULL,
      updated_at = now();
  END LOOP;

  UPDATE public.site_themes
  SET
    properties = properties
      || jsonb_build_object(
        'contact.phone', '+56 9 9063 9071',
        'contact.address', 'Tegualda 1571, Ñuñoa',
        'social.whatsapp', 'https://wa.me/56990639071'
      ),
    updated_at = now()
  WHERE template_kind = 'nago'::public.site_theme_kind;
END $$;
