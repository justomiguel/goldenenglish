-- Section fee plans: lifecycle (archive / restore / hard delete).
--
-- Add a soft-delete column so admins can take a plan out of circulation
-- without losing the historical reference (e.g. for sections where students
-- already paid using that plan). Hard delete remains available for plans
-- that were never used; the application enforces that distinction.

ALTER TABLE public.section_fee_plans
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS archived_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.section_fee_plans.archived_at IS
  'Soft-delete marker. When NOT NULL, the plan is archived: it does not appear in student / teacher views and is not selectable as the effective plan for new payments, but it is preserved for historical traceability.';

COMMENT ON COLUMN public.section_fee_plans.archived_by IS
  'Admin user that archived the plan (for audit trail).';

CREATE INDEX IF NOT EXISTS section_fee_plans_section_active_idx
  ON public.section_fee_plans (section_id)
  WHERE archived_at IS NULL;
