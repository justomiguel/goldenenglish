import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaginatedRegistrationsParams } from "@/lib/dashboard/loadPaginatedRegistrations";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";
import { loadCohortEnrollmentFeeAmount } from "@/lib/register/loadCohortEnrollmentFeeAmount";
import { loadAllChargingSectionIds } from "@/lib/register/markRegistrationRowsEnrollmentFee";
import { loadOpenCohortEnrollmentDefault } from "@/lib/register/loadOpenCohortEnrollmentDefault";
import {
  applyRegistrationFunnelFilter,
  parseRegistrationInboxFilter,
} from "@/lib/register/registrationInboxFilter";

const SORT_COLUMN_MAP: Record<RegistrationSortKey, string> = {
  name: "last_name",
  dni: "dni",
  email: "email",
  phoneStudent: "phone",
  phoneTutor: "tutor_phone",
  level: "level_interest",
  birth: "birth_date",
  status: "status",
  received: "created_at",
};

export function registrationListSort(params: PaginatedRegistrationsParams): {
  column: string;
  ascending: boolean;
} {
  return {
    column: SORT_COLUMN_MAP[params.sort ?? "received"] ?? "created_at",
    ascending: (params.dir ?? "desc") === "asc",
  };
}

function buildSearchFilter(q: string): string {
  const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const pattern = `%${escaped}%`;
  return [
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
    `dni.ilike.${pattern}`,
    `email.ilike.${pattern}`,
    `phone.ilike.${pattern}`,
  ].join(",");
}

type ListResult = { data: unknown; error: { message?: string } | null; count: number | null };

type ListQuery = {
  neq: (column: string, value: string) => ListQuery;
  or: (filters: string) => ListQuery;
  order: (column: string, options: { ascending: boolean }) => ListQuery;
  range: (from: number, to: number) => PromiseLike<ListResult>;
  then: (onfulfilled: (value: ListResult) => unknown) => PromiseLike<unknown>;
};

export async function openRegistrationListQueries(
  supabase: SupabaseClient,
  params: PaginatedRegistrationsParams,
  columns: string,
): Promise<{ dataQuery: ListQuery; countQuery: ListQuery }> {
  const inbox = params.inbox ?? parseRegistrationInboxFilter(undefined, params.status);
  const q = (params.q ?? "").trim().toLowerCase();
  let dataQuery = supabase.from("registrations").select(columns) as unknown as ListQuery;
  let countQuery = supabase
    .from("registrations")
    .select("id", { head: true, count: "exact" }) as unknown as ListQuery;
  if (inbox !== "enrolled_in_section") {
    dataQuery = dataQuery.neq("status", "enrolled");
    countQuery = countQuery.neq("status", "enrolled");
  }
  if (q) {
    const filter = buildSearchFilter(q);
    dataQuery = dataQuery.or(filter);
    countQuery = countQuery.or(filter);
  }
  const [chargingSectionIds, cohortFee] = await Promise.all([
    loadAllChargingSectionIds(supabase),
    params.cohortId
      ? loadCohortEnrollmentFeeAmount(supabase, params.cohortId)
      : loadOpenCohortEnrollmentDefault(supabase).then((row) => row?.amount ?? 0),
  ]);
  const openCohortFee = cohortFee;
  dataQuery = applyRegistrationFunnelFilter(
    dataQuery,
    inbox,
    chargingSectionIds,
    openCohortFee,
  ) as unknown as ListQuery;
  countQuery = applyRegistrationFunnelFilter(
    countQuery,
    inbox,
    chargingSectionIds,
    openCohortFee,
  ) as unknown as ListQuery;
  const sectionId = params.sectionId?.trim() ?? "";
  if (sectionId) {
    const sectionFilter = `preferred_section_id.eq.${sectionId},additional_section_ids.cs.{${sectionId}}`;
    dataQuery = dataQuery.or(sectionFilter);
    countQuery = countQuery.or(sectionFilter);
  }
  return { dataQuery, countQuery };
}
