-- Extend `payment_flow_finalize_records` with the financial settlement fields Flow returns
-- via getStatus().paymentData. These are admin-only data points (commission, net amount, settlement
-- date, FX rate when the order was multi-currency) used for finance reporting and reconciliation.
--
-- All columns are NULLable: Flow does not always return paymentData on every transaction
-- (e.g. legacy ones, sandbox sometimes omits fee). Pre-existing rows survive untouched.

BEGIN;

ALTER TABLE public.payment_flow_finalize_records
  ADD COLUMN IF NOT EXISTS fee NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(20, 8),
  ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMPTZ;

ALTER TABLE public.payment_flow_finalize_records
  DROP CONSTRAINT IF EXISTS payment_flow_finalize_records_fee_nonneg;
ALTER TABLE public.payment_flow_finalize_records
  ADD CONSTRAINT payment_flow_finalize_records_fee_nonneg
  CHECK (fee IS NULL OR fee >= 0);

ALTER TABLE public.payment_flow_finalize_records
  DROP CONSTRAINT IF EXISTS payment_flow_finalize_records_balance_nonneg;
ALTER TABLE public.payment_flow_finalize_records
  ADD CONSTRAINT payment_flow_finalize_records_balance_nonneg
  CHECK (balance IS NULL OR balance >= 0);

COMMENT ON COLUMN public.payment_flow_finalize_records.fee IS
  'Comisión cobrada por Flow para esta orden (paymentData.fee). NULL si Flow no la informó.';
COMMENT ON COLUMN public.payment_flow_finalize_records.balance IS
  'Monto neto que Flow liquidará al instituto (amount - fee). NULL si Flow no lo informó.';
COMMENT ON COLUMN public.payment_flow_finalize_records.transfer_date IS
  'Fecha estimada de liquidación del balance al comercio (paymentData.transferDate).';
COMMENT ON COLUMN public.payment_flow_finalize_records.conversion_rate IS
  'Tasa de conversión aplicada por Flow para órdenes multimoneda (paymentData.conversionRate).';
COMMENT ON COLUMN public.payment_flow_finalize_records.conversion_date IS
  'Fecha de la conversión cambiaria aplicada (paymentData.conversionDate).';

COMMIT;
