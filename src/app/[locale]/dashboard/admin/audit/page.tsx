import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import {
  loadPaginatedAuditEvents,
  type PaginatedAuditEventsParams,
} from "@/lib/dashboard/loadPaginatedAuditEvents";
import { AdminAuditLogScreen } from "@/components/organisms/AdminAuditLogScreen";
import type { AuditDomain } from "@/lib/audit/types";
import type { AuditSortDir, AuditSortKey } from "@/types/audit";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DOMAINS: Array<AuditDomain | "all"> = [
  "all",
  "academic",
  "sections",
  "finance",
  "identity",
  "communications",
  "system",
];
const SORT_KEYS: AuditSortKey[] = ["created_at", "actor", "domain", "action", "resource"];

/**
 * URL query keys (stable):
 * - `from`, `to` — YYYY-MM-DD (calendar days in UTC when applied in the loader).
 * - `actor` — profile UUID of the event actor.
 */
function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): PaginatedAuditEventsParams {
  const page = typeof raw.page === "string" ? parseInt(raw.page, 10) : 1;
  const domain =
    typeof raw.domain === "string" && DOMAINS.includes(raw.domain as AuditDomain)
      ? (raw.domain as AuditDomain)
      : "all";
  const sort =
    typeof raw.sort === "string" && SORT_KEYS.includes(raw.sort as AuditSortKey)
      ? (raw.sort as AuditSortKey)
      : "created_at";
  const dir: AuditSortDir = raw.dir === "asc" ? "asc" : "desc";
  const dateFrom = typeof raw.from === "string" ? raw.from : "";
  const dateTo = typeof raw.to === "string" ? raw.to : "";
  const actorId = typeof raw.actor === "string" ? raw.actor : "";

  return {
    page: Math.max(1, page || 1),
    q: typeof raw.q === "string" ? raw.q : "",
    domain,
    action: typeof raw.action === "string" ? raw.action : "",
    resourceType: typeof raw.resourceType === "string" ? raw.resourceType : "",
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    actorId: actorId || undefined,
    sort,
    dir,
  };
}

export default async function AdminAuditPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawSearchParams = await searchParams;
  const dict = await getDictionary(locale);
  const paginationParams = parseSearchParams(rawSearchParams);
  const supabase = await createClient();
  const result = await loadPaginatedAuditEvents(supabase, paginationParams);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.audit.listTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.audit.listLead}
      </p>
      <AdminAuditLogScreen
        rows={result.rows}
        totalCount={result.totalCount}
        page={result.page}
        pageSize={result.pageSize}
        searchQuery={paginationParams.q ?? ""}
        domainFilter={paginationParams.domain ?? "all"}
        actionFilter={paginationParams.action ?? ""}
        resourceTypeFilter={paginationParams.resourceType ?? ""}
        dateFrom={paginationParams.dateFrom ?? ""}
        dateTo={paginationParams.dateTo ?? ""}
        actorIdFilter={paginationParams.actorId ?? ""}
        sortKey={paginationParams.sort ?? "created_at"}
        sortDir={paginationParams.dir ?? "desc"}
        locale={locale}
        labels={dict.admin.audit}
        tableLabels={dict.admin.table}
      />
    </div>
  );
}
