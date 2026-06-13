import type { SupabaseClient } from "@supabase/supabase-js";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import { instituteCalendarPartsInTimeZone } from "@/lib/datetime/instituteCalendarMonthRange";
import { loadStudentMonthlyPaymentsView } from "@/lib/billing/loadStudentMonthlyPaymentsView";
import {
  countOverdueParentBillingInvoices,
  studentMonthlyPaymentsViewHasOverdueBalance,
} from "@/lib/parent/parentPaymentOverdueSignals";
import type { ParentHomePaymentOverdueSignals } from "@/lib/parent/loadParentHomePaymentOverdueSignals";

function instituteTodayYmd(now: Date): string {
  const props = loadProperties();
  const timeZone = getProperty(props, "analytics.timezone", "UTC");
  const { y, m, d } = instituteCalendarPartsInTimeZone(now, timeZone);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Payment overdue signals for a single student viewing their own portal (adults only). */
export async function loadStudentHomePaymentOverdueSignals(
  supabase: SupabaseClient,
  studentId: string,
  isMinor: boolean,
  now = new Date(),
): Promise<ParentHomePaymentOverdueSignals> {
  const overdueByStudent: Record<string, boolean> = { [studentId]: false };

  if (isMinor) {
    return { overdueByStudent, overdueInvoiceCount: 0 };
  }

  const { y, m } = instituteCalendarPartsInTimeZone(
    now,
    getProperty(loadProperties(), "analytics.timezone", "UTC"),
  );

  const view = await loadStudentMonthlyPaymentsView(supabase, studentId, [], {
    todayYear: y,
    todayMonth: m,
  });
  overdueByStudent[studentId] = studentMonthlyPaymentsViewHasOverdueBalance(view);

  const { data: invRows } = await supabase
    .from("billing_invoices")
    .select("due_date, status")
    .eq("student_id", studentId)
    .in("status", ["pending", "verifying", "overdue"])
    .limit(400);

  const overdueInvoiceCount = countOverdueParentBillingInvoices(
    (invRows ?? []) as { due_date: string; status: "pending" | "verifying" | "overdue" }[],
    instituteTodayYmd(now),
  );

  return { overdueByStudent, overdueInvoiceCount };
}
