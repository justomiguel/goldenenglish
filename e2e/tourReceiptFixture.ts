/**
 * Fixed billing receipt for admin `admin-finance-receipt-detail` tour L3.
 * Keep UUIDs aligned with `supabase/seeds/e2e/seed-admin.sql`.
 */
export const E2E_TOUR_RECEIPT_FIXTURE = {
  receiptId: "00000000-0000-4000-8000-e2e000000001",
  invoiceId: "00000000-0000-4000-8000-e2e000000002",
} as const;

export function tourReceiptStoragePath(studentId: string): string {
  const { invoiceId, receiptId } = E2E_TOUR_RECEIPT_FIXTURE;
  return `${studentId}/${invoiceId}/${receiptId}.png`;
}
