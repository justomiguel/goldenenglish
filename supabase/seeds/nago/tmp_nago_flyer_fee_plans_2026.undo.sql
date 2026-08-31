-- UNDO de tmp_nago_flyer_fee_plans_2026.sql
-- TEMPORAL / MANUAL — solo tenant Nagô.
--
-- Quita los planes 2026-01 CLP del flyer (40k…90k) y revierte trial/matrícula
-- que ese script escribió. Si ya había un plan 2026-01 con otro monto, ese
-- valor no se puede recuperar: este undo borra esa fila.
--
-- No toca horarios, nombres, ni pagos ya registrados.

DO $$
DECLARE
  v_plans int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.site_themes
    WHERE template_kind = 'nago'::public.site_theme_kind
  ) THEN
    RAISE EXCEPTION
      'tmp_nago_flyer_fee_plans_2026.undo.sql es solo para el tenant Nagô (site_themes.template_kind = nago).';
  END IF;

  DELETE FROM public.section_fee_plans p
  USING public.academic_sections s
  WHERE p.section_id = s.id
    AND s.archived_at IS NULL
    AND p.effective_from_year = 2026
    AND p.effective_from_month = 1
    AND p.currency = 'CLP'
    AND p.monthly_fee IN (40000, 50000, 60000, 70000, 80000, 90000);

  GET DIAGNOSTICS v_plans = ROW_COUNT;

  UPDATE public.academic_cohorts
  SET
    default_enrollment_fee_amount = NULL,
    default_monthly_fee = NULL,
    offers_trial = false,
    trial_fee_amount = 0,
    updated_at = now()
  WHERE archived_at IS NULL;

  UPDATE public.academic_sections
  SET
    enrollment_fee_amount = NULL,
    offers_trial = NULL,
    trial_fee_amount = NULL,
    updated_at = now()
  WHERE archived_at IS NULL
    AND trial_fee_amount = 15000
    AND COALESCE(enrollment_fee_amount, 0) = 0
    AND offers_trial IS TRUE;

  RAISE NOTICE 'Undo flyer fees: % planes 2026-01 CLP borrados.', v_plans;
END $$;

SELECT
  s.name,
  COALESCE(jsonb_array_length(s.schedule_slots), 0) AS times_per_week,
  p.effective_from_year,
  p.effective_from_month,
  p.monthly_fee,
  p.currency
FROM public.academic_sections s
LEFT JOIN public.section_fee_plans p
  ON p.section_id = s.id
 AND p.archived_at IS NULL
WHERE s.archived_at IS NULL
ORDER BY s.name, p.effective_from_year, p.effective_from_month;
