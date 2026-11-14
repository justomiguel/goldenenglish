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
>(
  rows: T[],
  chargingIds: ReadonlySet<string>,
  openCohortDefaultFee = 0,
): Array<T & { chargesEnrollmentFee: boolean }> {
  return rows.map((row) => {
    const sectionIds = requestedRegistrationSectionIds(row);
    const inherits = sectionIds.length === 0 && openCohortDefaultFee > 0;
    return {
      ...row,
      chargesEnrollmentFee:
        (row.snapshotTotal ?? 0) > 0 ||
        sectionIds.some((id) => chargingIds.has(id)) ||
        inherits,
    };
  });
}

function chargingSectionId(row: unknown): string | null {
  const typed = row as {
    id?: unknown;
    enrollment_fee_amount?: unknown;
    academic_cohorts?: CohortRel;
  };
  const id = String(typed.id ?? "").trim();
  if (!id) return null;
  const amount = resolveEffectiveEnrollmentFeeAmount(
    parseOptionalFeeAmount(typed.enrollment_fee_amount),
    parseOptionalFeeAmount(unwrapCohort(typed.academic_cohorts)?.default_enrollment_fee_amount),
  );
  return amount > 0 ? id : null;
}

const SECTION_PAGE = 1000;

type RangeQuery = {
  select: (cols: string) => {
    range: (
      from: number,
      to: number,
    ) => PromiseLike<{ data: unknown[] | null; error: { message?: string } | null }>;
  };
};

export async function loadAllChargingSectionIds(supabase: FeeClient): Promise<string[]> {
  const charging = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await (supabase.from("academic_sections") as RangeQuery)
      .select("id, enrollment_fee_amount, academic_cohorts(default_enrollment_fee_amount)")
      .range(from, from + SECTION_PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data) {
      const id = chargingSectionId(row);
      if (id) charging.add(id);
    }
    if (data.length < SECTION_PAGE) break;
    from += SECTION_PAGE;
  }
  return [...charging];
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
    const id = chargingSectionId(row);
    if (id) charging.add(id);
  }
  return charging;
}
