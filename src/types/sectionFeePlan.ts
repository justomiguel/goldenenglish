export interface SectionFeePlan {
  id: string;
  sectionId: string;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  monthlyFee: number;
  /** ISO 4217 (3 letras mayúsculas), p.ej. "USD", "ARS", "CLP". */
  currency: string;
  archivedAt: string | null;
}

export interface SectionFeePlanRowDb {
  id: string;
  section_id: string;
  effective_from_year: number;
  effective_from_month: number;
  monthly_fee: string | number;
  currency: string;
  archived_at?: string | null;
}

export const DEFAULT_SECTION_FEE_PLAN_CURRENCY = "USD" as const;

const ISO_4217_RE = /^[A-Z]{3}$/;

export function normalizeSectionFeePlanCurrency(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_SECTION_FEE_PLAN_CURRENCY;
  const upper = raw.trim().toUpperCase();
  return ISO_4217_RE.test(upper) ? upper : DEFAULT_SECTION_FEE_PLAN_CURRENCY;
}

export function mapSectionFeePlanRow(row: SectionFeePlanRowDb): SectionFeePlan {
  return {
    id: row.id,
    sectionId: row.section_id,
    effectiveFromYear: Number(row.effective_from_year),
    effectiveFromMonth: Number(row.effective_from_month),
    monthlyFee: typeof row.monthly_fee === "string" ? Number(row.monthly_fee) : row.monthly_fee,
    currency: normalizeSectionFeePlanCurrency(row.currency),
    archivedAt: row.archived_at ?? null,
  };
}

/**
 * Same as `SectionFeePlan` but enriched with admin-only lifecycle metadata
 * computed at the loader boundary (e.g. whether the plan already has student
 * payments mapped to its effective window). Stays out of student/teacher
 * surfaces.
 */
export interface SectionFeePlanWithUsage extends SectionFeePlan {
  inUse: boolean;
}
