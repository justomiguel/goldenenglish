-- One row per Flow.cl-approved payments row. Stores the authoritative bits we need to
-- regenerate a receipt later (paid_at as Flow saw it, payer_email, flow order id, raw snapshot
-- for forensic re-derivation). Pre-existing approved payments without this row keep working
-- via the loader fallback (payments + payment_flow_checkout_refs).
--
-- Writes: only via service_role (finalize hook in `finalizeMonthlyPaymentFromFlowGateway`).
-- Reads: the same audience as `payments` (alumno propio, parent/tutor con acceso, admin, teacher).

BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_flow_finalize_records (
  payment_id UUID PRIMARY KEY REFERENCES public.payments (id) ON DELETE CASCADE,
  flow_order BIGINT NOT NULL,
  commerce_order TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (char_length(currency) BETWEEN 3 AND 8),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ NOT NULL,
  payer_email TEXT,
  media_label TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_flow_finalize_records_flow_order_idx
  ON public.payment_flow_finalize_records (flow_order);

DROP TRIGGER IF EXISTS payment_flow_finalize_records_set_updated_at
  ON public.payment_flow_finalize_records;
CREATE TRIGGER payment_flow_finalize_records_set_updated_at
  BEFORE UPDATE ON public.payment_flow_finalize_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_flow_finalize_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_flow_finalize_records_select
  ON public.payment_flow_finalize_records;
CREATE POLICY payment_flow_finalize_records_select
  ON public.payment_flow_finalize_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_flow_finalize_records.payment_id
        AND (
          public.is_admin(auth.uid())
          OR p.student_id = auth.uid()
          OR p.parent_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles t
            WHERE t.id = auth.uid() AND t.role = 'teacher'
          )
          OR public.tutor_can_view_student_finance(auth.uid(), p.student_id)
        )
    )
  );

-- No INSERT / UPDATE / DELETE policies: service_role bypasses RLS, and end users must never
-- write here directly. Mutations live in the finalize hook (Flow webhook + return resolver).

COMMENT ON TABLE public.payment_flow_finalize_records IS
  'Snapshot of Flow.cl getStatus when a payments row transitioned to approved. Source of truth for receipts re-issued after the original return page.';

COMMIT;
