import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";

const REGISTRATION_COLUMNS = [
  "id", "first_name", "last_name", "dni", "email", "phone",
  "birth_date", "level_interest", "status", "created_at",
  "tutor_name", "tutor_dni", "tutor_email", "tutor_phone",
  "tutor_relationship",
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
  }));

  return {
    rows,
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
  };
}
