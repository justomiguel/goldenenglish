import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";
import type { RegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
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
import { attachRegistrationPreferredCohorts } from "@/lib/dashboard/attachRegistrationPreferredCohorts";
import { loadRegistrationCohortPage } from "@/lib/dashboard/loadRegistrationCohortPage";
import {
  mapRegistrationSelectRows,
  REGISTRATION_LIST_COLUMNS,
} from "@/lib/dashboard/mapRegistrationSelectRows";
import {
  openRegistrationListQueries,
  registrationListSort,
} from "@/lib/dashboard/registrationListQuery";

export interface PaginatedRegistrationsResult {
  rows: AdminRegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PaginatedRegistrationsParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: RegistrationSortKey;
  dir?: "asc" | "desc";
  /** Follow-up status filter; omitted means the Inscriptos stage. */
  status?: "new" | "contacted";
  inbox?: RegistrationInboxFilter;
  /** Match preferred or additional requested sections. */
  sectionId?: string;
  cohortId?: string;
  openCohortId?: string;
}

async function decorateRegistrationRows(supabase: SupabaseClient, rows: AdminRegistrationRow[]) {
  const requestedIds = rows.flatMap((row) => requestedRegistrationSectionIds(row));
  const [closedIds, chargingIds, withSeats] = await Promise.all([
    collectClosedRequestedSectionIds(supabase, requestedIds),
    collectSectionsChargingEnrollmentFee(supabase, requestedIds),
    attachTrialSeatsToRegistrationRows(supabase, rows),
  ]);
  return attachRegistrationPreferredCohorts(
    supabase,
    markRegistrationRowsEnrollmentFee(
      markRegistrationRowsClosedSections(withSeats, closedIds),
      chargingIds,
    ),
  );
}

export async function loadPaginatedRegistrations(
  supabase: SupabaseClient,
  params: PaginatedRegistrationsParams = {},
): Promise<PaginatedRegistrationsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  if (params.cohortId && params.openCohortId) {
    return loadRegistrationCohortPage(supabase, {
      ...params,
      cohortId: params.cohortId,
      openCohortId: params.openCohortId,
    });
  }

  const sort = registrationListSort(params);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { dataQuery, countQuery } = await openRegistrationListQueries(
    supabase,
    params,
    REGISTRATION_LIST_COLUMNS,
  );
  const [dataResult, countResult] = await Promise.all([
    dataQuery.order(sort.column, { ascending: sort.ascending }).range(from, to),
    countQuery,
  ]);
  if (dataResult.error) {
    return { rows: [], totalCount: countResult.count ?? 0, page, pageSize };
  }
  const rows = await decorateRegistrationRows(
    supabase,
    mapRegistrationSelectRows((dataResult.data ?? []) as unknown[]),
  );
  return { rows, totalCount: countResult.count ?? 0, page, pageSize };
}
