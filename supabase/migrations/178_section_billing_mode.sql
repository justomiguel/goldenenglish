-- Billing mode: fixed monthly section fee vs prepaid class packs.
--
-- Hay institutos que no cobran cuota fija mensual: cobran según cuántas clases toma el alumno, con
-- precio no lineal (el paquete de 1 clase vale X, el de 2 no vale 2X). Ese producto se factura por
-- una bolsa mensual de clases del alumno que cruza secciones (179) y se consume por asistencia (180).
--
-- Dos capas, a propósito:
--   * `site_settings.billing_model` es lo que el instituto elige. Define qué UI ve el admin y qué
--     default reciben las secciones nuevas. NO lo lee el cálculo del monto.
--   * `academic_sections.billing_mode` es el punto de enforcement que sí lee el cálculo.
-- Es la misma forma que usó la 154 (default de columna + backfill como decisión de producto, columna
-- como fuente de verdad en runtime). Permite migrar sección por sección, deja el histórico facturando
-- como siempre, y no obliga a mockear un setting global en cada test.
--
-- Los dos modos pueden convivir en un mismo instituto.
--
-- Deliberadamente NO se agrega un tercer valor a `monthly_fee_charge_mode`: su parser
-- (`parseMonthlyFeeChargeMode`) devuelve 'prorate_by_classes' ante cualquier valor desconocido, así
-- que un modo nuevo ahí haría que todo código que aún no lo conozca cobre una cuota prorrateada en
-- silencio. ADR: docs/adr/2026-08-class-pack-billing.md

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'section_monthly_fee';

DO $$
BEGIN
  ALTER TABLE public.academic_sections
    ADD CONSTRAINT academic_sections_billing_mode_check
    CHECK (billing_mode IN ('section_monthly_fee', 'class_pack'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.academic_sections.billing_mode IS
  'Cómo se cobra esta sección: section_monthly_fee (cuota fija por mes, section_fee_plans) o class_pack (bolsa mensual de clases del alumno, student_class_packs). Esta columna —no site_settings.billing_model— es lo que lee el cálculo del monto.';

CREATE INDEX IF NOT EXISTS academic_sections_billing_mode_idx
  ON public.academic_sections (billing_mode)
  WHERE billing_mode = 'class_pack';

-- Institute-level choice. Default preserva el comportamiento actual.
INSERT INTO public.site_settings (key, value)
VALUES ('billing_model', '"section_monthly_fee"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- El portal necesita leer el modelo para decidir qué pantalla de facturación renderizar.
-- La lista de claves replica la de 152_bank_transfer_instructions_setting.sql más billing_model:
-- recrear la política sin alguna de las anteriores rompería inscripciones, wizard, moneda o
-- instrucciones de transferencia.
DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;

CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'inscriptions_enabled',
      'initial_site_setup',
      'billing_currency',
      'bank_transfer_instructions',
      'billing_model'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard state, portal billing currency, bank transfer instructions, and the institute billing model (all non-secret).';
