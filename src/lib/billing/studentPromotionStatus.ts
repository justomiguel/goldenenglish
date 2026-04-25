export type StudentPromotionBenefit = "enrollment" | "monthly" | "both";

export interface StudentPromotionStatusRow {
  code_snapshot: string;
  promotion_snapshot: Record<string, unknown> | null;
  applies_to_snapshot: StudentPromotionBenefit;
  monthly_months_remaining: number | null;
  enrollment_consumed: boolean | null;
}

export function activePromotionLabel(
  rows: StudentPromotionStatusRow[] | undefined,
): string | null {
  const active = (rows ?? []).find((row) => {
    const appliesTo = row.applies_to_snapshot;
    const enrollmentActive =
      (appliesTo === "enrollment" || appliesTo === "both") &&
      !row.enrollment_consumed;
    const monthlyActive =
      (appliesTo === "monthly" || appliesTo === "both") &&
      (row.monthly_months_remaining == null || row.monthly_months_remaining > 0);
    return enrollmentActive || monthlyActive;
  });
  if (!active) return null;

  const name = active.promotion_snapshot?.name;
  return typeof name === "string" && name.trim()
    ? name.trim()
    : active.code_snapshot;
}
