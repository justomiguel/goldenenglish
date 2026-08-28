import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";
import { mapInboxLeadFields } from "@/lib/register/countRegistrationInboxFilters";
import {
  parseRegistrationInboxFilter,
  registrationInboxOrFilter,
  type RegistrationInboxFilter,
} from "@/lib/register/registrationInboxFilter";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import {
  collectClosedRequestedSectionIds,
  markRegistrationRowsClosedSections,
} from "@/lib/register/markRegistrationRowsClosedSections";

const REGISTRATION_COLUMNS = [
  "id", "first_name", "last_name", "dni", "email", "phone",
  "birth_date", "level_interest", "status", "created_at",
  "tutor_name", "tutor_dni", "tutor_email", "tutor_phone",
  "tutor_relationship", "preferred_section_id", "additional_section_ids",
  "contacted_at", "contacted_by", "source_section_link_id", "tenant_extras",
  "intake_state", "fee_snapshot", "fee_captured", "enrollment_fee_receipt_path",
].join(", ");

const SORT_COLUMN_MAP: Record<RegistrationSortKey, string> = {
  name: "last_name",
  dni: "dni",
  email: "email",
  level: "level_interest",
  birth: "birth_date",
  status: "status",
  received: "created_at",
};

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
  /** Follow-up status filter; omitted means the default urgent inbox. */
  status?: "new" | "contacted";
  inbox?: RegistrationInboxFilter;
  /** Match preferred or additional requested sections. */
  sectionId?: string;
}

/** Row shape for `registrations` select used in this loader (PostgREST typing can surface `GenericStringError` on `.data`). */
type RegistrationSelectRow = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  level_interest: string | null;
  status: string | null;
  created_at: string | null;
  tutor_name: string | null;
  tutor_dni: string | null;
  tutor_email: string | null;
  tutor_phone: string | null;
  tutor_relationship: string | null;
  preferred_section_id: string | null;
  additional_section_ids: string[] | null;
  contacted_at: string | null;
  contacted_by: string | null;
  source_section_link_id: string | null;
  tenant_extras?: unknown;
  intake_state?: unknown;
  fee_snapshot?: unknown;
  fee_captured?: unknown;
  enrollment_fee_receipt_path?: unknown;
};

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

export async function loadPaginatedRegistrations(
  supabase: SupabaseClient,
  params: PaginatedRegistrationsParams = {},
): Promise<PaginatedRegistrationsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const sortCol = SORT_COLUMN_MAP[params.sort ?? "received"] ?? "created_at";
  const ascending = (params.dir ?? "desc") === "asc";
  const q = (params.q ?? "").trim().toLowerCase();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .neq("status", "enrolled");

  let countQuery = supabase
    .from("registrations")
    .select("id", { head: true, count: "exact" })
    .neq("status", "enrolled");

  if (q) {
    const filter = buildSearchFilter(q);
    dataQuery = dataQuery.or(filter);
    countQuery = countQuery.or(filter);
  }

  const inbox = params.inbox ?? parseRegistrationInboxFilter(undefined, params.status);
  if (inbox === "contacted") {
    dataQuery = dataQuery.eq("status", "contacted");
    countQuery = countQuery.eq("status", "contacted");
  } else {
    const orFilter = registrationInboxOrFilter(inbox);
    if (orFilter) {
      dataQuery = dataQuery.or(orFilter);
      countQuery = countQuery.or(orFilter);
    }
  }

  const sectionId = params.sectionId?.trim() ?? "";
  if (sectionId) {
    const sectionFilter =
      `preferred_section_id.eq.${sectionId},additional_section_ids.cs.{${sectionId}}`;
    dataQuery = dataQuery.or(sectionFilter);
    countQuery = countQuery.or(sectionFilter);
  }

  dataQuery = dataQuery
    .order(sortCol, { ascending })
    .range(from, to);

  const [dataResult, countResult] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  if (dataResult.error) {
    return {
      rows: [],
      totalCount: countResult.count ?? 0,
      page,
      pageSize,
    };
  }

  const rawRows = (dataResult.data ?? []) as unknown as RegistrationSelectRow[];
  const rows: AdminRegistrationRow[] = rawRows.map((r) => ({
    id: String(r.id),
    first_name: String(r.first_name),
    last_name: String(r.last_name),
    dni: String(r.dni),
    email: String(r.email),
    phone: r.phone != null ? String(r.phone) : null,
    birth_date:
      r.birth_date != null && r.birth_date !== ""
        ? String(r.birth_date).slice(0, 10)
        : null,
    level_interest: r.level_interest != null ? String(r.level_interest) : null,
    status: String(r.status ?? ""),
    created_at: r.created_at != null ? String(r.created_at) : null,
    tutor_name: r.tutor_name != null ? String(r.tutor_name) : null,
    tutor_dni: r.tutor_dni != null ? String(r.tutor_dni) : null,
    tutor_email: r.tutor_email != null ? String(r.tutor_email) : null,
    tutor_phone: r.tutor_phone != null ? String(r.tutor_phone) : null,
    tutor_relationship:
      r.tutor_relationship != null ? String(r.tutor_relationship) : null,
    preferred_section_id:
      r.preferred_section_id != null ? String(r.preferred_section_id) : null,
    additionalSectionIds: Array.isArray(r.additional_section_ids)
      ? r.additional_section_ids.map(String).filter(Boolean)
      : [],
    existingStudentId: null,
    contacted_at: r.contacted_at != null ? String(r.contacted_at) : null,
    contacted_by: r.contacted_by != null ? String(r.contacted_by) : null,
    sourceSectionLinkId:
      r.source_section_link_id != null ? String(r.source_section_link_id) : null,
    tenantExtras: r.tenant_extras ?? {},
    ...mapInboxLeadFields(r),
  }));
  const closedIds = await collectClosedRequestedSectionIds(
    supabase,
    rows.flatMap((r) => requestedRegistrationSectionIds(r)),
  );

  return {
    rows: markRegistrationRowsClosedSections(rows, closedIds),
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
  };
}
