-- Section fee plans: monthly fee, payments per period, enrollment fee flag.
--
-- Una sección académica puede tener uno o más planes de cuotas con vigencias
-- (effective_from_year, effective_from_month). El plan vigente para un par
-- (year, month) es el de mayor (effective_from_year, effective_from_month) <=
-- (year, month). Esto permite cambiar el monto durante el año sin perder el
-- monto histórico ya facturado a los alumnos.
--
-- charges_enrollment_fee es metadata que indica si la sección cobra matrícula.
-- La matrícula se sigue gestionando por billing_invoices: este flag solo
-- declara explícitamente la propiedad de la sección y queda disponible para
-- automatizaciones futuras.

CREATE TABLE IF NOT EXISTS public.section_fee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  effective_from_year SMALLINT NOT NULL,
  effective_from_month SMALLINT NOT NULL,
  monthly_fee NUMERIC(12, 2) NOT NULL,
  payments_count SMALLINT NOT NULL,
  charges_enrollment_fee BOOLEAN NOT NULL DEFAULT false,
  period_start_year SMALLINT NOT NULL,
  period_start_month SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT section_fee_plans_month_range
    CHECK (effective_from_month BETWEEN 1 AND 12),
  CONSTRAINT section_fee_plans_year_range
    CHECK (effective_from_year BETWEEN 2000 AND 2100),
  CONSTRAINT section_fee_plans_period_month_range
    CHECK (period_start_month BETWEEN 1 AND 12),
  CONSTRAINT section_fee_plans_period_year_range
    CHECK (period_start_year BETWEEN 2000 AND 2100),
  CONSTRAINT section_fee_plans_fee_positive
    CHECK (monthly_fee >= 0),
  CONSTRAINT section_fee_plans_payments_count_range
    CHECK (payments_count BETWEEN 1 AND 24)
);

COMMENT ON TABLE public.section_fee_plans IS
  'Planes de cuotas por sección con vigencias. El plan activo para (year, month) es el más reciente con (effective_from_year, effective_from_month) <= (year, month).';

COMMENT ON COLUMN public.section_fee_plans.monthly_fee IS
  'Monto de la cuota mensual en la moneda del instituto. El descuento por beca se aplica en la app.';

COMMENT ON COLUMN public.section_fee_plans.payments_count IS
  'Cantidad de cuotas mensuales del período cubierto por este plan (1..24).';

COMMENT ON COLUMN public.section_fee_plans.charges_enrollment_fee IS
  'Si esta sección cobra matrícula. La matrícula sigue gestionándose por billing_invoices.';

COMMENT ON COLUMN public.section_fee_plans.period_start_month IS
  'Mes (1..12) del primer pago del período cubierto por este plan.';

CREATE UNIQUE INDEX IF NOT EXISTS section_fee_plans_section_effective_uidx
  ON public.section_fee_plans (section_id, effective_from_year, effective_from_month);

CREATE INDEX IF NOT EXISTS section_fee_plans_section_idx
  ON public.section_fee_plans (section_id);

-- updated_at trigger -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.section_fee_plans_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS section_fee_plans_set_updated_at ON public.section_fee_plans;
CREATE TRIGGER section_fee_plans_set_updated_at
  BEFORE UPDATE ON public.section_fee_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.section_fee_plans_set_updated_at();

-- RLS ----------------------------------------------------------------------
ALTER TABLE public.section_fee_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_fee_plans_select_scope ON public.section_fee_plans;
CREATE POLICY section_fee_plans_select_scope
  ON public.section_fee_plans FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.academic_sections s
      WHERE s.id = section_fee_plans.section_id
        AND s.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments e
      WHERE e.section_id = section_fee_plans.section_id
        AND e.status = 'active'
        AND (
          e.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS section_fee_plans_admin_write ON public.section_fee_plans;
CREATE POLICY section_fee_plans_admin_write
  ON public.section_fee_plans FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Section-aware payments ----------------------------------------------------
-- A student can be enrolled in more than one section at a time and each section
-- can have its own monthly fee. Payments must therefore be tracked per section
-- so the same calendar month can have a separate receipt for each section the
-- student is enrolled in.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS section_id UUID
    REFERENCES public.academic_sections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_section_idx ON public.payments (section_id);

-- Replace the legacy single-section unique with a section-aware version.
-- We keep both partial unique indexes:
--   * one for rows that target a section (the new model);
--   * one for legacy rows without section_id (preserve historical receipts).
DO $$
BEGIN
  ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_student_period_uidx;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DROP INDEX IF EXISTS public.payments_student_period_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_section_period_uidx
  ON public.payments (student_id, section_id, month, year)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_legacy_period_uidx
  ON public.payments (student_id, month, year)
  WHERE section_id IS NULL;

-- Allow a student to create their own pending payment row (with receipt) for a
-- section they are actively enrolled in. Existing admin/parent insert policies
-- in 002_platform_phase remain untouched.
DROP POLICY IF EXISTS payments_insert_student_self ON public.payments;
CREATE POLICY payments_insert_student_self
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
    AND section_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.section_enrollments se
      WHERE se.student_id = auth.uid()
        AND se.section_id = payments.section_id
        AND se.status = 'active'
    )
  );

-- Allow the same student to update only their own pending row (e.g. attach a
-- receipt). Admin update policy from 002 still wins for staff.
DROP POLICY IF EXISTS payments_update_student_self ON public.payments;
CREATE POLICY payments_update_student_self
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );
