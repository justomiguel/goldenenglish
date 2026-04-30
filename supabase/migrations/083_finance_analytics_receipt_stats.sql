-- Finance analytics: resolved_at on billing_receipts + receipt processing stats RPC.

-- 1. Add resolved_at to billing_receipts -----------------------------------------

ALTER TABLE public.billing_receipts
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill: approximate resolved_at for already-resolved receipts.
UPDATE public.billing_receipts
SET resolved_at = created_at
WHERE status != 'pending_approval' AND resolved_at IS NULL;

-- 2. Patch approve / reject RPCs to set resolved_at ----------------------------

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
  SET status = 'approved',
      rejection_reason_code = NULL,
      rejection_detail = NULL,
      resolved_at = now()
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
    rejection_detail = NULLIF(trim(COALESCE(p_detail, '')), ''),
    resolved_at = now()
  WHERE id = p_receipt_id AND status = 'pending_approval'
  RETURNING invoice_id INTO v_inv;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  SELECT due_date INTO v_due FROM public.billing_invoices WHERE id = v_inv;

  v_next := CASE
    WHEN v_due < CURRENT_DATE THEN 'overdue'::public.billing_invoice_status
    ELSE 'pending'::public.billing_invoice_status
  END;

  UPDATE public.billing_invoices
  SET status = v_next, updated_at = now()
  WHERE id = v_inv;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 3. Receipt processing stats RPC (admin-only) ---------------------------------

CREATE OR REPLACE FUNCTION public.admin_finance_receipt_processing_stats(
  p_cohort_id UUID,
  p_year INT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
  END IF;

  WITH cohort_sections AS (
    SELECT s.id
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
  ),
  monthly_resolved AS (
    SELECT
      p.id,
      p.status,
      EXTRACT(EPOCH FROM (p.updated_at - p.created_at)) / 86400.0 AS days_to_resolve
    FROM public.payments p
    JOIN public.section_enrollments se
      ON se.student_id = p.student_id AND se.section_id = p.section_id
    WHERE p.section_id IN (SELECT id FROM cohort_sections)
      AND p.year = p_year
      AND p.status IN ('approved', 'rejected')
  ),
  monthly_pending AS (
    SELECT
      p.id,
      EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0 AS age_days
    FROM public.payments p
    WHERE p.section_id IN (SELECT id FROM cohort_sections)
      AND p.year = p_year
      AND p.status = 'pending'
  ),
  monthly_agg AS (
    SELECT
      round(avg(days_to_resolve)::numeric, 1) AS avg_days,
      count(*) FILTER (WHERE status = 'approved') AS approved_count,
      count(*) FILTER (WHERE status = 'rejected') AS rejected_count,
      count(*) AS total_resolved
    FROM monthly_resolved
  ),
  monthly_pending_agg AS (
    SELECT
      count(*) AS total_pending,
      count(*) FILTER (WHERE age_days <= 1) AS bucket_0_24h,
      count(*) FILTER (WHERE age_days > 1 AND age_days <= 3) AS bucket_24_72h,
      count(*) FILTER (WHERE age_days > 3) AS bucket_72h_plus
    FROM monthly_pending
  ),
  invoice_resolved AS (
    SELECT
      br.id,
      br.status,
      br.rejection_reason_code,
      EXTRACT(EPOCH FROM (br.resolved_at - br.created_at)) / 86400.0 AS days_to_resolve
    FROM public.billing_receipts br
    JOIN public.billing_invoices bi ON bi.id = br.invoice_id
    JOIN public.section_enrollments se ON se.student_id = bi.student_id
    WHERE se.section_id IN (SELECT id FROM cohort_sections)
      AND EXTRACT(YEAR FROM bi.due_date) = p_year
      AND br.status IN ('approved', 'rejected')
      AND br.resolved_at IS NOT NULL
  ),
  invoice_agg AS (
    SELECT
      round(avg(days_to_resolve)::numeric, 1) AS avg_days,
      count(*) FILTER (WHERE status = 'approved') AS approved_count,
      count(*) FILTER (WHERE status = 'rejected') AS rejected_count,
      count(*) AS total_resolved
    FROM invoice_resolved
  ),
  rejection_breakdown AS (
    SELECT
      COALESCE(rejection_reason_code::text, 'other') AS reason,
      count(*) AS cnt
    FROM invoice_resolved
    WHERE status = 'rejected'
    GROUP BY rejection_reason_code
  )
  SELECT jsonb_build_object(
    'ok', true,
    'monthly', jsonb_build_object(
      'avgDays', COALESCE((SELECT avg_days FROM monthly_agg), null),
      'approvedCount', COALESCE((SELECT approved_count FROM monthly_agg), 0),
      'rejectedCount', COALESCE((SELECT rejected_count FROM monthly_agg), 0),
      'totalResolved', COALESCE((SELECT total_resolved FROM monthly_agg), 0)
    ),
    'invoice', jsonb_build_object(
      'avgDays', COALESCE((SELECT avg_days FROM invoice_agg), null),
      'approvedCount', COALESCE((SELECT approved_count FROM invoice_agg), 0),
      'rejectedCount', COALESCE((SELECT rejected_count FROM invoice_agg), 0),
      'totalResolved', COALESCE((SELECT total_resolved FROM invoice_agg), 0)
    ),
    'rejectionBreakdown', COALESCE(
      (SELECT jsonb_object_agg(reason, cnt) FROM rejection_breakdown),
      '{}'::jsonb
    ),
    'pending', jsonb_build_object(
      'total', COALESCE((SELECT total_pending FROM monthly_pending_agg), 0),
      'bucket0_24h', COALESCE((SELECT bucket_0_24h FROM monthly_pending_agg), 0),
      'bucket24_72h', COALESCE((SELECT bucket_24_72h FROM monthly_pending_agg), 0),
      'bucket72hPlus', COALESCE((SELECT bucket_72h_plus FROM monthly_pending_agg), 0)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_finance_receipt_processing_stats(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_finance_receipt_processing_stats(UUID, INT) TO authenticated;
