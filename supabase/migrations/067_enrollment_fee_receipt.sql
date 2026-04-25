-- Migration 067: enrollment fee receipt upload (student/parent/tutor)
--
-- Students, parents and tutors can upload a payment receipt for the enrollment
-- fee charged per academic section.  The receipt is stored in the existing
-- `payment-receipts` storage bucket under the path
--   {student_id}/enrollment-fee/{enrollment_id}-{timestamp}.{ext}
-- The path always starts with the student's own UUID, which satisfies the RLS
-- check already in use for monthly payment receipts.
--
-- Admin can then approve or reject the receipt from the billing tab.
-- Approval also records `last_enrollment_paid_at` automatically.

ALTER TABLE public.section_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_url        TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_status     TEXT
    CONSTRAINT section_enrollments_receipt_status_check
    CHECK (enrollment_fee_receipt_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_url IS
  'Storage path in the payment-receipts bucket for the enrollment fee receipt uploaded by the student / parent.';
COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_status IS
  'Review status of the enrollment fee receipt: pending | approved | rejected.';
COMMENT ON COLUMN public.section_enrollments.enrollment_fee_receipt_uploaded_at IS
  'When the student/parent last uploaded the enrollment fee receipt.';
