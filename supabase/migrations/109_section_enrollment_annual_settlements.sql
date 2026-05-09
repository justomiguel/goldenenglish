-- Annual tuition settlement: one accepted total for a coverage period replaces
-- percentage scholarships for those months in billing math (see apply + resolve).

CREATE TABLE IF NOT EXISTS public.section_enrollment_annual_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  coverage_from_year INT NOT NULL CHECK (coverage_from_year >= 2000 AND coverage_from_year <= 2100),
  coverage_from_month INT NOT NULL CHECK (coverage_from_month >= 1 AND coverage_from_month <= 12),
  coverage_until_year INT NOT NULL CHECK (coverage_until_year >= 2000 AND coverage_until_year <= 2100),
  coverage_until_month INT NOT NULL CHECK (coverage_until_month >= 1 AND coverage_until_month <= 12),
  includes_enrollment_fee BOOLEAN NOT NULL DEFAULT false,
  baseline_list_total NUMERIC(12, 2) NOT NULL CHECK (baseline_list_total >= 0),
  accepted_total NUMERIC(12, 2) NOT NULL CHECK (accepted_total >= 0),
  implied_discount_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_enrollment_annual_settlements_period_order CHECK (
    (coverage_until_year * 12 + coverage_until_month) >=
    (coverage_from_year * 12 + coverage_from_month)
  )
);

CREATE INDEX IF NOT EXISTS section_enrollment_annual_settlements_enrollment_idx
  ON public.section_enrollment_annual_settlements (enrollment_id);

CREATE INDEX IF NOT EXISTS section_enrollment_annual_settlements_lookup_idx
  ON public.section_enrollment_annual_settlements (enrollment_id, coverage_from_year, coverage_from_month);

COMMENT ON TABLE public.section_enrollment_annual_settlements IS
  'Staff-recorded annual deal: accepted_total vs list baseline; scholarship % ignored for covered months in resolveSectionPlanMonthlyAmount.';

ALTER TABLE public.section_enrollment_annual_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_enrollment_annual_settlements_select_scope
  ON public.section_enrollment_annual_settlements;
CREATE POLICY section_enrollment_annual_settlements_select_scope
  ON public.section_enrollment_annual_settlements
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND ts.student_id = section_enrollment_annual_settlements.student_id
    )
    OR public.user_leads_or_assists_section(auth.uid(), section_enrollment_annual_settlements.section_id)
  );

DROP POLICY IF EXISTS section_enrollment_annual_settlements_admin_write
  ON public.section_enrollment_annual_settlements;
CREATE POLICY section_enrollment_annual_settlements_admin_write
  ON public.section_enrollment_annual_settlements
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
