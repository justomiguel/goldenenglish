import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import type {
  PaginatedRegistrationsParams,
  PaginatedRegistrationsResult,
} from "@/lib/dashboard/loadPaginatedRegistrations";
import { mapRegistrationSelectRows, REGISTRATION_LIST_COLUMNS } from "@/lib/dashboard/mapRegistrationSelectRows";
import {
  activeSectionCohortIds,
  activeSectionNamesInCohort,
  loadActiveSectionFacts,
} from "@/lib/dashboard/registrationCohortFacts";
import { openRegistrationListQueries, registrationListSort } from "@/lib/dashboard/registrationListQuery";
import { attachRegistrationPreferredCohorts } from "@/lib/dashboard/attachRegistrationPreferredCohorts";
import { registrationBelongsToCohort } from "@/lib/register/registrationCohortMembership";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import {
  collectClosedRequestedSectionIds,
  markRegistrationRowsClosedSections,
} from "@/lib/register/markRegistrationRowsClosedSections";
import {
  collectSectionsChargingEnrollmentFee,
  markRegistrationRowsEnrollmentFee,
} from "@/lib/register/markRegistrationRowsEnrollmentFee";
import { attachTrialSeatsToRegistrationRows } from "@/lib/register/attachTrialSeatsToRegistrationRows";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const PAGE = 1000;

async function decorate(supabase: SupabaseClient, rows: AdminRegistrationRow[]) {
  const requestedIds = rows.flatMap((row) => requestedRegistrationSectionIds(row));
  const [closedIds, chargingIds, withSeats] = await Promise.all([
    collectClosedRequestedSectionIds(supabase, requestedIds),
    collectSectionsChargingEnrollmentFee(supabase, requestedIds),
    attachTrialSeatsToRegistrationRows(supabase, rows),
  ]);
  return markRegistrationRowsEnrollmentFee(
    markRegistrationRowsClosedSections(withSeats, closedIds),
    chargingIds,
  );
}

export async function loadRegistrationCohortPage(
  supabase: SupabaseClient,
  params: PaginatedRegistrationsParams & { cohortId: string; openCohortId: string },
): Promise<PaginatedRegistrationsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const sort = registrationListSort(params);
  const collected: AdminRegistrationRow[] = [];
  let from = 0;
  for (;;) {
    const { dataQuery } = await openRegistrationListQueries(
      supabase,
      params,
      REGISTRATION_LIST_COLUMNS,
    );
    const { data, error } = await dataQuery
      .order(sort.column, { ascending: sort.ascending })
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    const pageRows = data as unknown[];
    collected.push(...mapRegistrationSelectRows(pageRows));
    if (pageRows.length < PAGE) break;
    from += PAGE;
  }

  const withPreferred = await attachRegistrationPreferredCohorts(supabase, collected);
  const studentIds = withPreferred.flatMap((row) =>
    row.acceptedStudentId ? [row.acceptedStudentId] : [],
  );
  const facts = await loadActiveSectionFacts(supabase, studentIds);
  const filtered = withPreferred.flatMap((row) => {
    const cohortIds = activeSectionCohortIds(facts, row.acceptedStudentId);
    const belongs = registrationBelongsToCohort({
      selectedCohortId: params.cohortId,
      openCohortId: params.openCohortId,
      status: row.status,
      preferredSectionCohortId: row.preferredSectionCohortId ?? null,
      activeSectionCohortIds: cohortIds,
    });
    if (!belongs) return [];
    return [{
      ...row,
      activeSectionCohortIds: cohortIds,
      activeSectionNames: activeSectionNamesInCohort(facts, row.acceptedStudentId, params.cohortId),
    }];
  });
  const start = (page - 1) * pageSize;
  const slice = await decorate(supabase, filtered.slice(start, start + pageSize));
  return { rows: slice, totalCount: filtered.length, page, pageSize };
}
