-- Section fee plans: add multi-currency support and simplify the model.
--
-- Cambios respecto a 054_section_fee_plans.sql:
--   * ADD currency: ISO 4217 (3 letras mayúsculas), default 'USD'.
--   * DROP payments_count, period_start_year, period_start_month: el rango
--     temporal real lo dicta academic_sections.starts_on/ends_on. El prorrateo
--     del primer mes se calcula en la app desde el schedule_slots.
--
-- Decisión documentada en docs/adr/2026-04-section-fee-plans-currency-and-proration.md.

ALTER TABLE public.section_fee_plans
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'section_fee_plans_currency_iso4217'
  ) THEN
    ALTER TABLE public.section_fee_plans
      ADD CONSTRAINT section_fee_plans_currency_iso4217
      CHECK (currency ~ '^[A-Z]{3}$');
  END IF;
END $$;

COMMENT ON COLUMN public.section_fee_plans.currency IS
  'Código ISO 4217 (3 letras mayúsculas) en el que se cobra la cuota mensual de esta sección. Cada plan/sección puede tener su propia moneda.';

-- Drop columns + their CHECK constraints introduced in 054.
ALTER TABLE public.section_fee_plans
  DROP CONSTRAINT IF EXISTS section_fee_plans_payments_count_range,
  DROP CONSTRAINT IF EXISTS section_fee_plans_period_month_range,
  DROP CONSTRAINT IF EXISTS section_fee_plans_period_year_range;

ALTER TABLE public.section_fee_plans
  DROP COLUMN IF EXISTS payments_count,
  DROP COLUMN IF EXISTS period_start_year,
  DROP COLUMN IF EXISTS period_start_month;

COMMENT ON TABLE public.section_fee_plans IS
  'Planes de cuotas por sección. Cada plan tiene moneda + monto mensual + vigencia (effective_from). El plan activo para (year, month) es el más reciente con effective_from <= (year, month). El rango temporal real lo da academic_sections.starts_on/ends_on; el prorrateo del primer mes lo calcula la app a partir del schedule_slots.';
