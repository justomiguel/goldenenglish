import type { AdminBillingScholarship } from "@/types/adminStudentBilling";

export type SectionCollectionsPaymentHistoryRow = {
  id: string;
  studentId: string;
  studentDisplayName: string;
  month: number;
  year: number;
  amount: number | null;
  status: string;
  admin_notes: string | null;
  updated_at: string;
  receiptSignedUrl: string | null;
  /** Flow finalize snapshot (admin-only). Present when the row was paid via Flow.cl. */
  flowFinalize: SectionCollectionsFlowFinalizeSummary | null;
};

export type SectionCollectionsFlowFinalizeSummary = {
  flowOrder: number;
  commerceOrder: string;
  currency: string;
  amount: number;
  paidAt: string;
  payerEmail: string | null;
  mediaLabel: string | null;
  /** Flow commission charged on this order, if reported. */
  fee: number | null;
  /** Net amount Flow will settle to the merchant (amount − fee), if reported. */
  balance: number | null;
  transferDate: string | null;
  conversionRate: number | null;
  conversionDate: string | null;
};

export type SectionCollectionsScholarshipListRow = {
  id: string;
  studentId: string;
  studentDisplayName: string;
  scholarship: AdminBillingScholarship;
};
