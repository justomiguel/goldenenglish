-- Section-scoped billing benefits.
--
-- Benefits belong to the student-section enrollment, not to the student
-- globally: one student can attend multiple active sections with different
-- enrollment-fee exemptions or scholarship percentages.

ALTER TABLE public.section_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_fee_exempt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_reason TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_authorized_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_enrollment_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scholarship_discount_percent NUMERIC(5, 2) CHECK (
    scholarship_discount_percent IS NULL
    OR (scholarship_discount_percent >= 0 AND scholarship_discount_percent <= 100)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_note TEXT,
  ADD COLUMN IF NOT EXISTS scholarship_valid_from_year INT CHECK (
    scholarship_valid_from_year IS NULL
    OR (scholarship_valid_from_year >= 2000 AND scholarship_valid_from_year <= 2100)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_valid_from_month INT CHECK (
    scholarship_valid_from_month IS NULL
    OR (scholarship_valid_from_month >= 1 AND scholarship_valid_from_month <= 12)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_valid_until_year INT CHECK (
    scholarship_valid_until_year IS NULL
    OR (scholarship_valid_until_year >= 2000 AND scholarship_valid_until_year <= 2100)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_valid_until_month INT CHECK (
    scholarship_valid_until_month IS NULL
    OR (scholarship_valid_until_month >= 1 AND scholarship_valid_until_month <= 12)
  ),
  ADD COLUMN IF NOT EXISTS scholarship_is_active BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS section_enrollments_student_section_benefits_idx
  ON public.section_enrollments (student_id, section_id)
  WHERE status = 'active';

WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.id ORDER BY se.created_at DESC, se.id))[1] AS enrollment_id,
    count(*) AS active_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.section_enrollments se
SET
  enrollment_fee_exempt = p.enrollment_fee_exempt,
  enrollment_exempt_reason = p.enrollment_exempt_reason,
  enrollment_exempt_authorized_by = p.enrollment_exempt_authorized_by,
  enrollment_exempt_at = p.enrollment_exempt_at,
  last_enrollment_paid_at = p.last_enrollment_paid_at
FROM single_active_section sas
JOIN public.profiles p ON p.id = sas.student_id
WHERE se.id = sas.enrollment_id
  AND sas.active_count = 1
  AND (
    p.enrollment_fee_exempt = true
    OR p.last_enrollment_paid_at IS NOT NULL
  );

WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.id ORDER BY se.created_at DESC, se.id))[1] AS enrollment_id,
    count(*) AS active_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.section_enrollments se
SET
  scholarship_discount_percent = sc.discount_percent,
  scholarship_note = sc.note,
  scholarship_valid_from_year = sc.valid_from_year,
  scholarship_valid_from_month = sc.valid_from_month,
  scholarship_valid_until_year = sc.valid_until_year,
  scholarship_valid_until_month = sc.valid_until_month,
  scholarship_is_active = sc.is_active
FROM single_active_section sas
JOIN public.student_scholarships sc ON sc.student_id = sas.student_id
WHERE se.id = sas.enrollment_id
  AND sas.active_count = 1;
