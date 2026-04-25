import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";

type PaymentRow = {
  id: string;
  section_id: string | null;
  month: number;
  year: number;
  amount: number | string | null;
  status: StudentMonthlyPaymentRecord["status"];
  receipt_url: string | null;
};

/**
 * Payments for the given calendar year, grouped by `section_id` (nullable legacy rows).
 */
export async function loadStudentYearSectionPaymentsMap(
  supabase: SupabaseClient,
  studentId: string,
  sectionIds: string[],
  year: number,
): Promise<Map<string | null, StudentMonthlyPaymentRecord[]>> {
  const paymentsBySection = new Map<string | null, StudentMonthlyPaymentRecord[]>();
  if (sectionIds.length === 0) return paymentsBySection;

  const { data: payments } = await supabase
    .from("payments")
    .select("id, section_id, month, year, amount, status, receipt_url")
    .eq("student_id", studentId)
    .eq("year", year)
    .in("section_id", sectionIds);
  const records: StudentMonthlyPaymentRecord[] = await Promise.all(
    ((payments ?? []) as PaymentRow[]).map(async (p) => ({
      id: p.id,
      sectionId: p.section_id,
      month: Number(p.month),
      year: Number(p.year),
      amount: p.amount == null ? null : Number(p.amount),
      status: p.status,
      receiptSignedUrl: await studentReceiptSignedUrl(supabase, studentId, p.receipt_url),
    })),
  );
  for (const rec of records) {
    const list = paymentsBySection.get(rec.sectionId) ?? [];
    list.push(rec);
    paymentsBySection.set(rec.sectionId, list);
  }
  return paymentsBySection;
}
