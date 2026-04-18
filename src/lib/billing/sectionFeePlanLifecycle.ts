import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeSectionFeePlansInUseIds,
  type SectionFeePlanPaymentRef,
} from "@/lib/billing/computeSectionFeePlansUsage";
import {
  mapSectionFeePlanRow,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";

/**
 * Server-side helpers for the section fee plan lifecycle (archive / restore /
 * hard delete). Pure orchestration around Supabase: kept out of the action
 * file so the action stays thin and the architecture rule (one concern, file
 * size) holds.
 */

export async function loadSectionCohortId(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("academic_sections")
    .select("cohort_id")
    .eq("id", sectionId)
    .maybeSingle();
  return (data as { cohort_id?: string } | null)?.cohort_id ?? null;
}

/**
 * True when at least one payment row for the section maps to the given plan's
 * effective + period window. Used to refuse hard delete: archived plans keep
 * being attributable for past payments, so we still consider all plans (not
 * only the active ones) when computing attribution.
 */
export async function isSectionFeePlanInUse(
  supabase: SupabaseClient,
  sectionId: string,
  planId: string,
): Promise<boolean> {
  const { data: planRows } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, payments_count, charges_enrollment_fee, period_start_year, period_start_month, archived_at",
    )
    .eq("section_id", sectionId);
  const plans = ((planRows ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
  if (plans.length === 0) return false;

  const { data: paymentRows } = await supabase
    .from("payments")
    .select("year, month")
    .eq("section_id", sectionId);
  const payments: SectionFeePlanPaymentRef[] = ((paymentRows ?? []) as Array<{
    year: number;
    month: number;
  }>).map((p) => ({ year: Number(p.year), month: Number(p.month) }));

  const inUseIds = computeSectionFeePlansInUseIds(plans, payments);
  return inUseIds.has(planId);
}
