export type BillingInvoiceStatus =
  | "pending"
  | "verifying"
  | "paid"
  | "overdue"
  | "voided";

export type BillingReceiptStatus = "pending_approval" | "approved" | "rejected";

export type BillingRejectionReasonCode =
  | "image_blurry"
  | "amount_mismatch"
  | "wrong_account"
  | "other";

export type BillingInvoiceRow = {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  status: BillingInvoiceStatus;
  description: string;
  external_reference_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BillingReceiptRow = {
  id: string;
  invoice_id: string;
  uploaded_by: string;
  receipt_storage_path: string;
  amount_paid: number;
  status: BillingReceiptStatus;
  rejection_reason_code: BillingRejectionReasonCode | null;
  rejection_detail: string | null;
  created_at: string;
};
