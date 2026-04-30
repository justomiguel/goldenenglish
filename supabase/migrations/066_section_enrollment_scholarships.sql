-- Multiple section-scoped scholarships.
--
-- A student can have several scholarships in the same section enrollment. Active
-- scholarships that cover the same month are summed by the app and capped at 100%.

CREATE TABLE IF NOT EXISTS public.section_enrollment_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  discount_percent NUMERIC(5, 2) NOT NULL CHECK (
    discount_percent >= 0 AND discount_percent <= 100
  ),
  note TEXT,
  valid_from_year INT NOT NULL CHECK (valid_from_year >= 2000 AND valid_from_year <= 2100),
  valid_from_month INT NOT NULL CHECK (valid_from_month >= 1 AND valid_from_month <= 12),
  valid_until_year INT CHECK (valid_until_year IS NULL OR (valid_until_year >= 2000 AND valid_until_year <= 2100)),
  valid_until_month INT CHECK (valid_until_month IS NULL OR (valid_until_month >= 1 AND valid_until_month <= 12)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_enrollment_scholarships_period_order CHECK (
    valid_until_year IS NULL
    OR valid_until_month IS NULL
    OR (valid_until_year * 12 + valid_until_month) >= (valid_from_year * 12 + valid_from_month)
  )
);

CREATE INDEX IF NOT EXISTS section_enrollment_scholarships_enrollment_idx
  ON public.section_enrollment_scholarships (enrollment_id);

CREATE INDEX IF NOT EXISTS section_enrollment_scholarships_scope_idx
  ON public.section_enrollment_scholarships (section_id, student_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS section_enrollment_scholarships_legacy_backfill_once
  ON public.section_enrollment_scholarships (enrollment_id)
  WHERE note = 'Migrated from section_enrollments scholarship fields';

ALTER TABLE public.section_enrollment_scholarships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_enrollment_scholarships_select_scope ON public.section_enrollment_scholarships;
CREATE POLICY section_enrollment_scholarships_select_scope ON public.section_enrollment_scholarships
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND ts.student_id = section_enrollment_scholarships.student_id
    )
    OR public.user_leads_or_assists_section(auth.uid(), section_enrollment_scholarships.section_id)
  );

DROP POLICY IF EXISTS section_enrollment_scholarships_admin_write ON public.section_enrollment_scholarships;
CREATE POLICY section_enrollment_scholarships_admin_write ON public.section_enrollment_scholarships
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.section_enrollment_scholarships (
  enrollment_id,
  section_id,
  student_id,
  discount_percent,
  note,
  valid_from_year,
  valid_from_month,
  valid_until_year,
  valid_until_month,
  is_active
)
SELECT
  se.id,
  se.section_id,
  se.student_id,
  se.scholarship_discount_percent,
  COALESCE(se.scholarship_note, 'Migrated from section_enrollments scholarship fields'),
  se.scholarship_valid_from_year,
  se.scholarship_valid_from_month,
  se.scholarship_valid_until_year,
  se.scholarship_valid_until_month,
  COALESCE(se.scholarship_is_active, false)
FROM public.section_enrollments se
WHERE se.scholarship_discount_percent IS NOT NULL
  AND se.scholarship_valid_from_year IS NOT NULL
  AND se.scholarship_valid_from_month IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.section_enrollment_scholarships ses
    WHERE ses.enrollment_id = se.id
      AND ses.discount_percent = se.scholarship_discount_percent
      AND ses.valid_from_year = se.scholarship_valid_from_year
      AND ses.valid_from_month = se.scholarship_valid_from_month
      AND COALESCE(ses.valid_until_year, -1) = COALESCE(se.scholarship_valid_until_year, -1)
      AND COALESCE(ses.valid_until_month, -1) = COALESCE(se.scholarship_valid_until_month, -1)
  );
