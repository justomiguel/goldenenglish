import type { SupabaseClient } from "@supabase/supabase-js";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import {
  instituteCalendarPartsInTimeZone,
  instituteMonthYmdRangeInTimeZone,
} from "@/lib/datetime/instituteCalendarMonthRange";
import type { BillingInvoiceStatus } from "@/types/billing";
import { selectParentMonthBillingInvoiceFocus, type ParentMonthInvoiceRow } from "@/lib/parent/selectParentMonthBillingInvoiceFocus";

export type ParentMonthBillingSummary = {
  monthTitle: string;
  invoiceCount: number;
  totalAmount: number;
  hasPriorOverdue: boolean;
};

function formatMonthTitle(locale: string, timeZone: string, y: number, m: number): string {
  const mid = new Date(Date.UTC(y, m - 1, 15, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone }).format(mid);
}

export async function loadParentMonthBillingInvoiceSummary(
  supabase: SupabaseClient,
  tutorId: string,
  locale: string,
  now = new Date(),
): Promise<ParentMonthBillingSummary | null> {
  const props = loadProperties();
  const timeZone = getProperty(props, "analytics.timezone", "UTC");
  const { start, end } = instituteMonthYmdRangeInTimeZone(now, timeZone);
  const { y, m } = instituteCalendarPartsInTimeZone(now, timeZone);

  const { data: links } = await supabase.from("tutor_student_rel").select("student_id").eq("tutor_id", tutorId);
  const linkedIds = [...new Set((links ?? []).map((l) => l.student_id as string))];
  if (linkedIds.length === 0) return null;

  const { data: profs } = await supabase.from("profiles").select("id, is_minor").in("id", linkedIds);
  const minorIds = (profs ?? [])
    .filter((p) => (p as { is_minor?: boolean }).is_minor === true)
    .map((p) => (p as { id: string }).id);
  if (minorIds.length === 0) return null;

  const { data: inv } = await supabase
    .from("billing_invoices")
    .select("due_date, status, amount")
    .in("student_id", minorIds)
    .in("status", ["pending", "verifying", "overdue"])
    .order("due_date", { ascending: true })
    .limit(400);

  const rows: ParentMonthInvoiceRow[] = (inv ?? []).map((r) => ({
    due_date: String((r as { due_date: string }).due_date),
    status: (r as { status: BillingInvoiceStatus }).status,
    amount: Number((r as { amount: number }).amount),
  }));

  const focused = selectParentMonthBillingInvoiceFocus(rows, start, end);
  const hasPriorOverdue = focused.some(
    (r) => r.status === "overdue" && r.due_date.slice(0, 10) < start,
  );
  const totalAmount = focused.reduce((a, r) => a + (Number.isFinite(r.amount) ? r.amount : 0), 0);

  return {
    monthTitle: formatMonthTitle(locale, timeZone, y, m),
    invoiceCount: focused.length,
    totalAmount,
    hasPriorOverdue,
  };
}
