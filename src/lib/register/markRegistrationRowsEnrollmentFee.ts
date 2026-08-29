import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
} from "@/lib/billing/resolveCohortFeeDefaults";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";

type CohortRel =
  | { default_enrollment_fee_amount?: unknown }
  | { default_enrollment_fee_amount?: unknown }[]
  | null
  | undefined;

type FeeQuery = {
  select: (cols: string) => {
    in: (
      col: string,
      ids: string[],
    ) => PromiseLike<{ data: unknown[] | null; error: { message?: string } | null }>;
  };
};

type FeeClient = {
  from: (table: string) => unknown;
};

function unwrapCohort(rel: CohortRel): { default_enrollment_fee_amount?: unknown } | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export function markRegistrationRowsEnrollmentFee<
  T extends {
    preferred_section_id: string | null;
    additionalSectionIds?: string[] | null;
    snapshotTotal?: number;
  },
>(rows: T[], chargingIds: ReadonlySet<string>): Array<T & { chargesEnrollmentFee: boolean }> {
  return rows.map((row) => ({
    ...row,
    chargesEnrollmentFee:
      (row.snapshotTotal ?? 0) > 0 ||
      requestedRegistrationSectionIds(row).some((id) => chargingIds.has(id)),
  }));
}

export async function collectSectionsChargingEnrollmentFee(
  supabase: FeeClient,
  sectionIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(sectionIds.map((id) => id.trim()).filter(Boolean))];
  const charging = new Set<string>();
  if (ids.length === 0) return charging;
  const { data, error } = await (supabase.from("academic_sections") as FeeQuery)
    .select("id, enrollment_fee_amount, academic_cohorts(default_enrollment_fee_amount)")
    .in("id", ids);
  if (error || !data) return charging;
  for (const row of data) {
    const typed = row as {
      id?: unknown;
      enrollment_fee_amount?: unknown;
      academic_cohorts?: CohortRel;
    };
    const id = String(typed.id ?? "").trim();
    if (!id) continue;
    const amount = resolveEffectiveEnrollmentFeeAmount(
      parseOptionalFeeAmount(typed.enrollment_fee_amount),
      parseOptionalFeeAmount(unwrapCohort(typed.academic_cohorts)?.default_enrollment_fee_amount),
    );
    if (amount > 0) charging.add(id);
  }
  return charging;
}
