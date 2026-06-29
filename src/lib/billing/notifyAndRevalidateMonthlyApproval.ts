import "server-only";
import { revalidatePath } from "next/cache";
import { notifyMonthlyPaymentDecision } from "@/lib/email/billingPaymentEmails";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import type { Locale } from "@/types/i18n";

/**
 * Shared post-approval aftermath for a gateway-confirmed monthly payment:
 * notifies the family and revalidates the billing surfaces (rule 27). Provider
 * specifics (finalize records, analytics) stay in each finalize flow.
 */
export function notifyAndRevalidateMonthlyApproval(input: {
  studentId: string;
  month: number;
  year: number;
  amount: number;
  currency: string;
  locale: Locale;
}): void {
  void notifyMonthlyPaymentDecision({
    studentId: input.studentId,
    locale: input.locale,
    month: input.month,
    year: input.year,
    amount: input.amount,
    currency: input.currency,
    decision: "approved",
    adminNotes: null,
  });

  for (const l of ["en", "es"] as const) {
    revalidateStudentBillingPaths(l, input.studentId);
    revalidatePath(`/${l}/dashboard/admin/finance`, "layout");
    revalidatePath(`/${l}/dashboard/student/payments`);
    revalidatePath(`/${l}/dashboard/parent/payments`);
  }
}
