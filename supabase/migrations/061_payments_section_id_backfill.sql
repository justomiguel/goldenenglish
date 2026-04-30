-- Ensure section-scoped payments exist for the finance cohort matrix.
--
-- Migration 054 introduced `payments.section_id`; some environments may have
-- section fee plans without this column. Keep this migration idempotent so the
-- finance RPC and loaders can rely on the section-aware payment model.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS section_id UUID
    REFERENCES public.academic_sections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_section_idx ON public.payments (section_id);

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

-- Best-effort attribution for legacy pending/approved rows. If a student has
-- exactly one active section, the legacy payment clearly belongs to it. Rows for
-- students with multiple active sections stay NULL to avoid corrupt attribution.
WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.section_id ORDER BY se.section_id::text))[1] AS section_id,
    count(DISTINCT se.section_id) AS section_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.payments p
SET section_id = sas.section_id
FROM single_active_section sas
WHERE p.section_id IS NULL
  AND p.student_id = sas.student_id
  AND sas.section_count = 1;

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
