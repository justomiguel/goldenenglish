import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import type { AuditDomain, AuditJsonObject } from "@/lib/audit/types";
import type { AdminAuditRow, AuditSortDir, AuditSortKey } from "@/types/audit";

const AUDIT_COLUMNS = [
  "id",
  "actor_id",
  "actor_role",
  "domain",
  "action",
  "resource_type",
  "resource_id",
  "summary",
  "before_values",
  "after_values",
  "diff",
  "metadata",
  "correlation_id",
  "created_at",
].join(", ");

const SORT_COLUMN_MAP: Record<AuditSortKey, string> = {
  created_at: "created_at",
  actor: "actor_id",
  domain: "domain",
  action: "action",
  resource: "resource_type",
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Calendar day bounds in UTC (v1): from 00:00:00.000Z to 23:59:59.999Z of that day. */
function parseDateKeyForUtcRange(s: string | undefined): string | null {
  const t = (s ?? "").trim();
  if (!t || !ISO_DATE_RE.test(t)) return null;
  const d = new Date(`${t}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : t;
}

function parseActorIdFilter(s: string | undefined): string | null {
  const t = (s ?? "").trim();
  if (!t || !UUID_RE.test(t)) return null;
  return t;
}

export interface PaginatedAuditEventsParams {
  page?: number;
  pageSize?: number;
  q?: string;
  domain?: AuditDomain | "all";
  action?: string;
  resourceType?: string;
  /** YYYY-MM-DD inclusive start (UTC day start). */
  dateFrom?: string;
  /** YYYY-MM-DD inclusive end (UTC day end). */
  dateTo?: string;
  /** Profile UUID of the actor; invalid values are ignored. */
  actorId?: string;
  sort?: AuditSortKey;
  dir?: AuditSortDir;
}

export interface PaginatedAuditEventsResult {
  rows: AdminAuditRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type AuditSelectRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  domain: AuditDomain;
  action: string;
  resource_type: string;
  resource_id: string | null;
  summary: string | null;
  before_values: AuditJsonObject | null;
  after_values: AuditJsonObject | null;
  diff: AuditJsonObject | null;
  metadata: AuditJsonObject | null;
  correlation_id: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

function escapeFilter(value: string): string {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function buildSearchFilter(q: string): string {
  const pattern = `%${escapeFilter(q)}%`;
  return [
    `action.ilike.${pattern}`,
    `resource_type.ilike.${pattern}`,
    `resource_id.ilike.${pattern}`,
    `summary.ilike.${pattern}`,
  ].join(",");
}

function actorLabel(profile: ProfileRow | undefined, fallback: string | null): string {
  if (!profile) return fallback ?? "";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || fallback || "";
}

export async function loadPaginatedAuditEvents(
  supabase: SupabaseClient,
  params: PaginatedAuditEventsParams = {},
): Promise<PaginatedAuditEventsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const sortCol = SORT_COLUMN_MAP[params.sort ?? "created_at"] ?? "created_at";
  const ascending = (params.dir ?? "desc") === "asc";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase.from("audit_events").select(AUDIT_COLUMNS);
  let countQuery = supabase
    .from("audit_events")
    .select("id", { head: true, count: "exact" });

  const q = (params.q ?? "").trim();
  if (params.domain && params.domain !== "all") {
    dataQuery = dataQuery.eq("domain", params.domain);
    countQuery = countQuery.eq("domain", params.domain);
  }
  if (params.action?.trim()) {
    dataQuery = dataQuery.eq("action", params.action.trim());
    countQuery = countQuery.eq("action", params.action.trim());
  }
  if (params.resourceType?.trim()) {
    dataQuery = dataQuery.eq("resource_type", params.resourceType.trim());
    countQuery = countQuery.eq("resource_type", params.resourceType.trim());
  }
  const actorId = parseActorIdFilter(params.actorId);
  if (actorId) {
    dataQuery = dataQuery.eq("actor_id", actorId);
    countQuery = countQuery.eq("actor_id", actorId);
  }
  const fromKey = parseDateKeyForUtcRange(params.dateFrom);
  const toKey = parseDateKeyForUtcRange(params.dateTo);
  if (fromKey) {
    const startIso = `${fromKey}T00:00:00.000Z`;
    dataQuery = dataQuery.gte("created_at", startIso);
    countQuery = countQuery.gte("created_at", startIso);
  }
  if (toKey) {
    const endIso = `${toKey}T23:59:59.999Z`;
    dataQuery = dataQuery.lte("created_at", endIso);
    countQuery = countQuery.lte("created_at", endIso);
  }
  if (q) {
    const filter = buildSearchFilter(q);
    dataQuery = dataQuery.or(filter);
    countQuery = countQuery.or(filter);
  }

  dataQuery = dataQuery.order(sortCol, { ascending }).range(from, to);

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
  if (dataResult.error) {
    return { rows: [], totalCount: countResult.count ?? 0, page, pageSize };
  }

  const rawRows = (dataResult.data ?? []) as unknown as AuditSelectRow[];
  const actorIds = [...new Set(rawRows.map((row) => row.actor_id).filter(Boolean))] as string[];
  let profiles = new Map<string, ProfileRow>();
  if (actorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    profiles = new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  }

  return {
    rows: rawRows.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      actorName: actorLabel(row.actor_id ? profiles.get(row.actor_id) : undefined, row.actor_id),
      actorRole: row.actor_role,
      domain: row.domain,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      summary: row.summary ?? "",
      beforeValues: row.before_values ?? {},
      afterValues: row.after_values ?? {},
      diff: row.diff ?? {},
      metadata: row.metadata ?? {},
      correlationId: row.correlation_id,
      createdAt: row.created_at,
    })),
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
  };
}
