import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";
import type { PaginatedRegistrationsParams } from "@/lib/dashboard/loadPaginatedRegistrations";
import { parseRegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";

const VALID_SORT_KEYS: RegistrationSortKey[] = [
  "name", "dni", "email", "phoneStudent", "phoneTutor", "level", "birth", "status", "received",
];

export function parseRegistrationsListSearchParams(
  raw: Record<string, string | string[] | undefined>,
): PaginatedRegistrationsParams {
  const pageStr = typeof raw.page === "string" ? raw.page : "1";
  const q = typeof raw.q === "string" ? raw.q : "";
  const sort = typeof raw.sort === "string" && VALID_SORT_KEYS.includes(raw.sort as RegistrationSortKey)
    ? (raw.sort as RegistrationSortKey)
    : "received";
  const dir = raw.dir === "asc" ? "asc" : "desc";
  const status = raw.status === "new" || raw.status === "contacted" ? raw.status : undefined;
  const inboxRaw = typeof raw.inbox === "string" ? raw.inbox : undefined;

  return {
    page: Math.max(1, parseInt(pageStr, 10) || 1),
    q,
    sort,
    dir,
    status,
    inbox: parseRegistrationInboxFilter(inboxRaw, status),
  };
}
