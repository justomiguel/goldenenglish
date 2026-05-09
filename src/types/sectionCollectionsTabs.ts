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
};

export type SectionCollectionsScholarshipListRow = {
  id: string;
  studentId: string;
  studentDisplayName: string;
  scholarship: AdminBillingScholarship;
};
