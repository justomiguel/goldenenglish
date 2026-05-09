import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import type { BillableSettlementMonth } from "@/lib/billing/computeAnnualTuitionSettlementAllocations";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";

export async function collectBillableMonthsForSettlementYear(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
  year: number,
): Promise<{ months: BillableSettlementMonth[]; currency: string }> {
  const months: BillableSettlementMonth[] = [];
  let currency: string = DEFAULT_SECTION_FEE_PLAN_CURRENCY;
  for (let m = 1; m <= 12; m++) {
    const plan = await resolveSectionPlanMonthlyAmount(supabase, studentId, sectionId, year, m, {
      billingScope: "plan-year",
      ignoreScholarships: true,
    });
    if (plan.code !== "ok" || plan.amount <= 0) continue;
    months.push({ year, month: m, listAmount: plan.amount });
    currency = plan.currency;
  }
  return { months, currency };
}
