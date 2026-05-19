import type { SupabaseClient } from "@supabase/supabase-js";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import { instituteCalendarPartsInTimeZone } from "@/lib/datetime/instituteCalendarMonthRange";
import { loadStudentMonthlyPaymentsView } from "@/lib/billing/loadStudentMonthlyPaymentsView";
import {
  countOverdueParentBillingInvoices,
  studentMonthlyPaymentsViewHasOverdueBalance,
} from "@/lib/parent/parentPaymentOverdueSignals";

export type ParentHomePaymentOverdueSignals = {
  overdueByStudent: Record<string, boolean>;
  overdueInvoiceCount: number;
};

function instituteTodayYmd(now: Date): string {
  const props = loadProperties();
  const timeZone = getProperty(props, "analytics.timezone", "UTC");
  const { y, m, d } = instituteCalendarPartsInTimeZone(now, timeZone);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export async function loadParentHomePaymentOverdueSignals(
  supabase: SupabaseClient,
  tutorId: string,
  now = new Date(),
): Promise<ParentHomePaymentOverdueSignals> {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);

  const studentIds = [...new Set((links ?? []).map((row) => row.student_id as string))];
  const overdueByStudent: Record<string, boolean> = {};
  for (const id of studentIds) overdueByStudent[id] = false;

  const { y, m } = instituteCalendarPartsInTimeZone(
    now,
    getProperty(loadProperties(), "analytics.timezone", "UTC"),
  );

  await Promise.all(
    studentIds.map(async (studentId) => {
      const view = await loadStudentMonthlyPaymentsView(supabase, studentId, [], {
        todayYear: y,
        todayMonth: m,
      });
      overdueByStudent[studentId] = studentMonthlyPaymentsViewHasOverdueBalance(view);
    }),
  );

  const { data: profs } = studentIds.length
    ? await supabase.from("profiles").select("id, is_minor").in("id", studentIds)
    : { data: [] as { id: string; is_minor: boolean }[] };

  const minorIds = (profs ?? [])
    .filter((profile) => profile.is_minor)
    .map((profile) => profile.id as string);

  let overdueInvoiceCount = 0;
  if (minorIds.length > 0) {
    const { data: invRows } = await supabase
      .from("billing_invoices")
      .select("due_date, status")
      .in("student_id", minorIds)
      .in("status", ["pending", "verifying", "overdue"])
      .limit(400);

    overdueInvoiceCount = countOverdueParentBillingInvoices(
      (invRows ?? []) as { due_date: string; status: "pending" | "verifying" | "overdue" }[],
      instituteTodayYmd(now),
    );
  }

  return { overdueByStudent, overdueInvoiceCount };
}
