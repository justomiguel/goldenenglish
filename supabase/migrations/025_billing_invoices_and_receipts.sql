-- Structured billing: invoices + receipt submissions (manual reconciliation).
-- Coexists with legacy public.payments (monthly rows). MercadoPago-ready external_reference_id on invoices.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_invoice_status') THEN
    CREATE TYPE public.billing_invoice_status AS ENUM ('pending', 'verifying', 'paid', 'overdue', 'voided');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_receipt_status') THEN
    CREATE TYPE public.billing_receipt_status AS ENUM ('pending_approval', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_rejection_reason_code') THEN
    CREATE TYPE public.billing_rejection_reason_code AS ENUM (
      'image_blurry',
      'amount_mismatch',
      'wrong_account',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status public.billing_invoice_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  external_reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_invoices_student_status_idx
  ON public.billing_invoices (student_id, status);

CREATE INDEX IF NOT EXISTS billing_invoices_due_idx
  ON public.billing_invoices (due_date);

DROP TRIGGER IF EXISTS billing_invoices_set_updated_at ON public.billing_invoices;
CREATE TRIGGER billing_invoices_set_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.billing_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices (id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  receipt_storage_path TEXT NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
  status public.billing_receipt_status NOT NULL DEFAULT 'pending_approval',
  rejection_reason_code public.billing_rejection_reason_code,
  rejection_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_receipts_invoice_status_idx
  ON public.billing_receipts (invoice_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS billing_receipt_one_pending_per_invoice
  ON public.billing_receipts (invoice_id)
  WHERE status = 'pending_approval';

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_receipts ENABLE ROW LEVEL SECURITY;

-- Invoices: admin full access
DROP POLICY IF EXISTS billing_invoices_admin_all ON public.billing_invoices;
CREATE POLICY billing_invoices_admin_all ON public.billing_invoices
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Student sees own; tutor sees linked ward invoices
DROP POLICY IF EXISTS billing_invoices_select_scope ON public.billing_invoices;
CREATE POLICY billing_invoices_select_scope ON public.billing_invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = billing_invoices.student_id
    )
  );

DROP POLICY IF EXISTS billing_invoices_update_responsible ON public.billing_invoices;
CREATE POLICY billing_invoices_update_responsible ON public.billing_invoices
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = billing_invoices.student_id
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = billing_invoices.student_id
    )
  );

-- Receipts: mirror invoice access
DROP POLICY IF EXISTS billing_receipts_admin_all ON public.billing_receipts;
CREATE POLICY billing_receipts_admin_all ON public.billing_receipts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS billing_receipts_select_scope ON public.billing_receipts;
CREATE POLICY billing_receipts_select_scope ON public.billing_receipts
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.billing_invoices inv
      WHERE inv.id = billing_receipts.invoice_id
        AND (
          inv.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = inv.student_id
          )
        )
    )
  );

DROP POLICY IF EXISTS billing_receipts_insert_responsible ON public.billing_receipts;
CREATE POLICY billing_receipts_insert_responsible ON public.billing_receipts
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.billing_invoices inv
      WHERE inv.id = invoice_id
        AND (
          inv.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.tutor_student_rel ts
            WHERE ts.tutor_id = auth.uid() AND ts.student_id = inv.student_id
          )
        )
    )
  );

-- Approve: atomic receipt + invoice (SECURITY DEFINER; admin-only inside)
CREATE OR REPLACE FUNCTION public.admin_approve_billing_receipt(p_receipt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
  END IF;

  UPDATE public.billing_receipts
  SET status = 'approved', rejection_reason_code = NULL, rejection_detail = NULL
  WHERE id = p_receipt_id AND status = 'pending_approval'
  RETURNING invoice_id INTO v_inv;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  UPDATE public.billing_invoices
  SET status = 'paid', updated_at = now()
  WHERE id = v_inv;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_billing_receipt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_billing_receipt(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_billing_receipt(
  p_receipt_id UUID,
  p_code public.billing_rejection_reason_code,
  p_detail TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv UUID;
  v_due DATE;
  v_next public.billing_invoice_status;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
  END IF;

  UPDATE public.billing_receipts
  SET
    status = 'rejected',
    rejection_reason_code = p_code,
    rejection_detail = NULLIF(trim(COALESCE(p_detail, '')), '')
  WHERE id = p_receipt_id AND status = 'pending_approval'
  RETURNING invoice_id INTO v_inv;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  SELECT due_date INTO v_due FROM public.billing_invoices WHERE id = v_inv;

  v_next := CASE WHEN v_due < CURRENT_DATE THEN 'overdue'::public.billing_invoice_status ELSE 'pending'::public.billing_invoice_status END;

  UPDATE public.billing_invoices
  SET status = v_next, updated_at = now()
  WHERE id = v_inv;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_billing_receipt(UUID, public.billing_rejection_reason_code, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_billing_receipt(UUID, public.billing_rejection_reason_code, TEXT) TO authenticated;

-- Storage: admins may read any receipt in payment-receipts (signed URLs use service role today; policy supports user JWT too)
DROP POLICY IF EXISTS payment_receipts_select_admin ON storage.objects;
CREATE POLICY payment_receipts_select_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.is_admin(auth.uid())
  );
