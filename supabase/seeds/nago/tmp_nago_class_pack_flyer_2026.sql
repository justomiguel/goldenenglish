-- TEMPORAL / MANUAL — solo tenant Nagô.
-- No es una migración: correr a mano en la base de Capoeira Nagô.
--
-- El flyer no es “Kids vale $90.000”. Es: el apoderado elige cuántas veces
-- por semana viene el alumno y paga ese tramo, en cualquier sección.
--
-- Eso no vive en section_fee_plans (un monto por sección). Vive en el
-- producto de bolsas: class_pack_prices + academic_sections.billing_mode.
--
-- class_count = clases del mes ≈ veces/semana × 4:
--   1× →  4 clases → $40.000
--   2× →  8 clases → $50.000
--   3× → 12 clases → $60.000
--   4× → 16 clases → $70.000
--   5× → 20 clases → $80.000
--   6× → 24 clases → $90.000
--
-- La familia compra el paquete del mes. Cada asistencia consume 1 clase.
-- Si un mes tiene 5 martes, se recarga otro paquete (el producto lo permite).
-- Clase de prueba $15.000 se deja en la sección, no en el catálogo.

DO $$
DECLARE
  v_tiers int := 0;
  v_sections int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.site_themes
    WHERE template_kind = 'nago'::public.site_theme_kind
  ) THEN
    RAISE EXCEPTION
      'tmp_nago_class_pack_flyer_2026.sql es solo para el tenant Nagô (site_themes.template_kind = nago).';
  END IF;

  INSERT INTO public.site_settings (key, value)
  VALUES ('billing_model', '"class_pack"'::jsonb)
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;

  UPDATE public.academic_sections
  SET
    billing_mode = 'class_pack',
    offers_trial = true,
    trial_fee_amount = 15000,
    enrollment_fee_amount = 0,
    updated_at = now()
  WHERE archived_at IS NULL;
  GET DIAGNOSTICS v_sections = ROW_COUNT;

  UPDATE public.academic_cohorts
  SET
    offers_trial = true,
    trial_fee_amount = 15000,
    default_enrollment_fee_amount = 0,
    updated_at = now()
  WHERE archived_at IS NULL;

  WITH wanted(class_count, amount) AS (
    VALUES
      (4,  40000::numeric),
      (8,  50000),
      (12, 60000),
      (16, 70000),
      (20, 80000),
      (24, 90000)
  ),
  touched AS (
    UPDATE public.class_pack_prices p
    SET
      amount = w.amount,
      currency = 'CLP',
      archived_at = NULL,
      archived_by = NULL,
      updated_at = now()
    FROM wanted w
    WHERE p.effective_from_year = 2026
      AND p.effective_from_month = 1
      AND p.class_count = w.class_count
      AND p.archived_at IS NULL
    RETURNING p.id
  )
  INSERT INTO public.class_pack_prices (
    effective_from_year,
    effective_from_month,
    class_count,
    amount,
    currency
  )
  SELECT 2026, 1, w.class_count, w.amount, 'CLP'
  FROM wanted w
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.class_pack_prices p
    WHERE p.effective_from_year = 2026
      AND p.effective_from_month = 1
      AND p.class_count = w.class_count
      AND p.archived_at IS NULL
  );

  SELECT COUNT(*)::int
    INTO v_tiers
  FROM public.class_pack_prices
  WHERE effective_from_year = 2026
    AND effective_from_month = 1
    AND archived_at IS NULL
    AND currency = 'CLP';

  RAISE NOTICE
    'Nagô class packs flyer: % secciones en class_pack, % tramos 2026-01 CLP.',
    v_sections,
    v_tiers;
END $$;

SELECT
  class_count,
  (class_count / 4) AS times_per_week,
  amount,
  currency
FROM public.class_pack_prices
WHERE effective_from_year = 2026
  AND effective_from_month = 1
  AND archived_at IS NULL
ORDER BY class_count;

SELECT name, billing_mode, trial_fee_amount
FROM public.academic_sections
WHERE archived_at IS NULL
ORDER BY name;
