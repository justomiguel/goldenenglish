-- TEMPORAL / MANUAL — solo tenant Nagô.
-- No es una migración: correr a mano en la base de Capoeira Nagô.
--
-- Plan de cuotas del flyer Ñuñoa (valores mensuales CLP):
--   1× $40.000  2× $50.000  3× $60.000
--   4× $70.000  5× $80.000  6× $90.000
--   clase de prueba $15.000 · sin matrícula
--
-- El monto de cada sección = veces por semana (cantidad de schedule_slots).
-- Idempotente. No toca horarios ni nombres.

DO $$
DECLARE
  v_year int := 2026;
  v_updated int := 0;
  r record;
  v_times int;
  v_fee numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.site_themes
    WHERE template_kind = 'nago'::public.site_theme_kind
  ) THEN
    RAISE EXCEPTION
      'tmp_nago_flyer_fee_plans_2026.sql es solo para el tenant Nagô (site_themes.template_kind = nago).';
  END IF;

  UPDATE public.academic_cohorts
  SET
    default_enrollment_fee_amount = 0,
    default_monthly_fee = 40000,
    offers_trial = true,
    trial_fee_amount = 15000,
    updated_at = now()
  WHERE archived_at IS NULL;

  FOR r IN
    SELECT s.id, s.schedule_slots
    FROM public.academic_sections s
    WHERE s.archived_at IS NULL
  LOOP
    v_times := GREATEST(1, LEAST(COALESCE(jsonb_array_length(r.schedule_slots), 1), 6));
    v_fee := 30000 + (10000 * v_times);

    UPDATE public.academic_sections
    SET
      enrollment_fee_amount = 0,
      monthly_fee_charge_mode = 'full_month_fee',
      allow_advance_monthly_payment = true,
      billing_mode = 'section_monthly_fee',
      offers_trial = true,
      trial_fee_amount = 15000,
      updated_at = now()
    WHERE id = r.id;

    INSERT INTO public.section_fee_plans (
      section_id,
      effective_from_year,
      effective_from_month,
      monthly_fee,
      currency
    )
    VALUES (r.id, v_year, 1, v_fee, 'CLP')
    ON CONFLICT (section_id, effective_from_year, effective_from_month) DO UPDATE
    SET
      monthly_fee = EXCLUDED.monthly_fee,
      currency = EXCLUDED.currency,
      archived_at = NULL,
      archived_by = NULL,
      updated_at = now();

    v_updated := v_updated + 1;
  END LOOP;

  RAISE NOTICE 'Nagô flyer fees: % secciones actualizadas (vigencia 2026-01, CLP).', v_updated;
END $$;

SELECT
  s.name,
  COALESCE(jsonb_array_length(s.schedule_slots), 0) AS times_per_week,
  p.monthly_fee,
  p.currency,
  s.trial_fee_amount,
  s.enrollment_fee_amount
FROM public.academic_sections s
JOIN public.section_fee_plans p
  ON p.section_id = s.id
 AND p.effective_from_year = 2026
 AND p.effective_from_month = 1
WHERE s.archived_at IS NULL
  AND p.archived_at IS NULL
ORDER BY s.name;
