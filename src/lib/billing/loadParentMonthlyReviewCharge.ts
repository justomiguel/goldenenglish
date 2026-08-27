import type { SupabaseClient } from "@supabase/supabase-js";
import { listPayableParentMonthSections } from "@/lib/billing/listPayableParentMonthSections";
import { assertParentMonthlyReviewSnapshot } from "@/lib/billing/assertParentMonthlyReviewSnapshot";
import { loadStudentMonthlyPaymentsView } from "@/lib/billing/loadStudentMonthlyPaymentsView";
import type { ParentMonthlyPayScope } from "@/lib/billing/listPayableParentMonthSections";
import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";

export type ParentMonthlyReviewCharge =
  | { ok: false; reason: "invalid" | "stale" }
  | {
      ok: true;
      studentId: string;
      originSectionId: string;
      month: number;
      year: number;
      scope: ParentMonthlyPayScope;
      lines: PayableParentMonthLine[];
      total: number;
      currency: string;
    };

export function parseParentMonthlyReviewForm(formData: FormData): {
  studentId: string;
  originSectionId: string;
  month: number;
  year: number;
  amount: number;
  scope: ParentMonthlyPayScope;
} | null {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const originSectionId = String(formData.get("sectionId") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const scopeRaw = String(formData.get("scope") ?? "current").trim();
  const scope: ParentMonthlyPayScope = scopeRaw === "all" ? "all" : "current";
  if (!studentId || !originSectionId || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { studentId, originSectionId, month, year, amount, scope };
}

export async function loadParentMonthlyReviewCharge(
  supabase: SupabaseClient,
  parsed: NonNullable<ReturnType<typeof parseParentMonthlyReviewForm>>,
): Promise<ParentMonthlyReviewCharge> {
  const today = new Date();
  const monthlyView = await loadStudentMonthlyPaymentsView(supabase, parsed.studentId, [], {
    todayYear: today.getFullYear(),
    todayMonth: today.getMonth() + 1,
  });
  const payable = listPayableParentMonthSections({
    view: monthlyView,
    originSectionId: parsed.originSectionId,
    month: parsed.month,
    year: parsed.year,
    scope: parsed.scope,
    useFullMonthAmount: true,
  });
  if (payable.lines.length === 0 || !payable.currency) {
    return { ok: false, reason: "stale" };
  }
  if (
    !assertParentMonthlyReviewSnapshot({
      computedTotal: payable.total,
      submittedTotal: parsed.amount,
      currency: payable.currency,
    })
  ) {
    return { ok: false, reason: "stale" };
  }
  return {
    ok: true,
    studentId: parsed.studentId,
    originSectionId: parsed.originSectionId,
    month: parsed.month,
    year: parsed.year,
    scope: parsed.scope,
    lines: payable.lines,
    total: payable.total,
    currency: payable.currency,
  };
}
