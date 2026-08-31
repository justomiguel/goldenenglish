import type { SupabaseClient } from "@supabase/supabase-js";
import { computeParentMonthlyReviewCharge } from "@/lib/billing/computeParentMonthlyReviewCharge";
import { loadFamilyBillingPolicy } from "@/lib/billing/loadFamilyBillingPolicy";
import { loadStudentPaidTrialCredit } from "@/lib/billing/loadStudentPaidTrialCredit";
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
      trialCreditApplied: number;
      trialCreditRegistrationId: string | null;
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
  if (!Number.isFinite(amount) || amount < 0) return null;
  return { studentId, originSectionId, month, year, amount, scope };
}

export async function loadParentMonthlyReviewCharge(
  supabase: SupabaseClient,
  parsed: NonNullable<ReturnType<typeof parseParentMonthlyReviewForm>>,
  options?: { admin?: SupabaseClient },
): Promise<ParentMonthlyReviewCharge> {
  const settingsClient = options?.admin ?? supabase;
  const today = new Date();
  const monthlyView = await loadStudentMonthlyPaymentsView(supabase, parsed.studentId, [], {
    todayYear: today.getFullYear(),
    todayMonth: today.getMonth() + 1,
  });
  const { data: profile } = await settingsClient
    .from("profiles")
    .select("dni_or_passport")
    .eq("id", parsed.studentId)
    .maybeSingle();
  const [policy, trialCredit] = await Promise.all([
    loadFamilyBillingPolicy(settingsClient),
    loadStudentPaidTrialCredit(settingsClient, {
      studentId: parsed.studentId,
      dni: profile?.dni_or_passport == null ? null : String(profile.dni_or_passport),
    }),
  ]);
  const computed = computeParentMonthlyReviewCharge({
    view: monthlyView,
    originSectionId: parsed.originSectionId,
    month: parsed.month,
    year: parsed.year,
    requestedScope: parsed.scope,
    submittedTotal: parsed.amount,
    policy,
    trialCredit,
  });
  if (!computed.ok) return computed;
  return {
    ok: true,
    studentId: parsed.studentId,
    originSectionId: parsed.originSectionId,
    month: parsed.month,
    year: parsed.year,
    scope: computed.scope,
    lines: computed.lines,
    total: computed.total,
    currency: computed.currency,
    trialCreditApplied: computed.trialCreditApplied,
    trialCreditRegistrationId: computed.trialCreditRegistrationId,
  };
}
