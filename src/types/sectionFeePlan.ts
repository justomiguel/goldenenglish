export interface SectionFeePlan {
  id: string;
  sectionId: string;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  monthlyFee: number;
  paymentsCount: number;
  chargesEnrollmentFee: boolean;
  periodStartYear: number;
  periodStartMonth: number;
  archivedAt: string | null;
}

export interface SectionFeePlanRowDb {
  id: string;
  section_id: string;
  effective_from_year: number;
  effective_from_month: number;
  monthly_fee: string | number;
  payments_count: number;
  charges_enrollment_fee: boolean;
  period_start_year: number;
  period_start_month: number;
  archived_at?: string | null;
}

export function mapSectionFeePlanRow(row: SectionFeePlanRowDb): SectionFeePlan {
  return {
    id: row.id,
    sectionId: row.section_id,
    effectiveFromYear: Number(row.effective_from_year),
    effectiveFromMonth: Number(row.effective_from_month),
    monthlyFee: typeof row.monthly_fee === "string" ? Number(row.monthly_fee) : row.monthly_fee,
    paymentsCount: Number(row.payments_count),
    chargesEnrollmentFee: Boolean(row.charges_enrollment_fee),
    periodStartYear: Number(row.period_start_year),
    periodStartMonth: Number(row.period_start_month),
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
