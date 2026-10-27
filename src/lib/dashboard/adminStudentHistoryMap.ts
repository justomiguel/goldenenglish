import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { AuditJsonObject } from "@/lib/audit/types";

export type AdminStudentCohortHistoryItem = {
  enrollmentId: string;
  cohortId: string;
  cohortName: string;
  cohortIsCurrent: boolean;
  sectionId: string;
  sectionName: string;
  teacherName: string;
  status: string;
  enrolledAtDisplay: string;
};

export type AdminStudentAuditChangePair = {
  field: string;
  before: string;
  after: string;
};

export type AdminStudentAuditHistoryItem = {
  id: string;
  createdAtIso: string;
  createdAtDisplay: string;
  actorName: string;
  kind: "profile" | "tutor" | "enrollment";
  action: string;
  summary: string;
  changes: AdminStudentAuditChangePair[];
};

export type AdminStudentHistoryData = {
  cohorts: AdminStudentCohortHistoryItem[];
  auditEvents: AdminStudentAuditHistoryItem[];
};

export type ProfileNameRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export type RawAuditEventRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  domain: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  summary: string | null;
  before_values: AuditJsonObject | null;
  after_values: AuditJsonObject | null;
  diff: AuditJsonObject | null;
  metadata: AuditJsonObject | null;
  created_at: string;
};

function formatDateTime(locale: string, iso: string | null | undefined, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDateOnly(locale: string, iso: string | null | undefined, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

function classifyAuditKind(
  domain: string,
  resourceType: string,
  action: string,
): "profile" | "tutor" | "enrollment" {
  const rt = resourceType.toLowerCase();
  const act = action.toLowerCase();
  if (rt.includes("tutor") || act.includes("tutor")) {
    return "tutor";
  }
  if (
    domain === "academic" ||
    domain === "sections" ||
    rt.includes("enrollment") ||
    rt.includes("section")
  ) {
    return "enrollment";
  }
  return "profile";
}

function extractChanges(
  beforeValues: AuditJsonObject | null,
  afterValues: AuditJsonObject | null,
  diff: AuditJsonObject | null,
  emptyDisplay: string,
): AdminStudentAuditChangePair[] {
  const before = beforeValues ?? {};
  const after = afterValues ?? {};
  const diffObj = diff ?? {};
  const keys = [
    ...new Set([
      ...Object.keys(diffObj),
      ...Object.keys(before),
      ...Object.keys(after),
    ]),
  ];

  const pairs: AdminStudentAuditChangePair[] = [];
  for (const key of keys) {
    const dEntry = diffObj[key] as { before?: unknown; after?: unknown } | undefined;
    const rawBefore =
      dEntry && typeof dEntry === "object" && "before" in dEntry
        ? dEntry.before
        : before[key];
    const rawAfter =
      dEntry && typeof dEntry === "object" && "after" in dEntry
        ? dEntry.after
        : after[key];
    const bStr =
      rawBefore == null || String(rawBefore).trim() === ""
        ? emptyDisplay
        : String(rawBefore);
    const aStr =
      rawAfter == null || String(rawAfter).trim() === ""
        ? emptyDisplay
        : String(rawAfter);
    if (bStr === emptyDisplay && aStr === emptyDisplay) continue;
    pairs.push({ field: key, before: bStr, after: aStr });
  }
  return pairs;
}

export function mapAuditRowToStudentHistoryItem(
  row: RawAuditEventRow,
  profileById: Map<string, ProfileNameRow>,
  locale: string,
  emptyDisplay = "—",
): AdminStudentAuditHistoryItem {
  const actorProfile = row.actor_id ? profileById.get(row.actor_id) : undefined;
  const actorName = actorProfile
    ? formatProfileSnakeSurnameFirst(actorProfile, row.actor_role ?? emptyDisplay)
    : row.actor_role ?? emptyDisplay;

  return {
    id: String(row.id),
    createdAtIso: String(row.created_at ?? ""),
    createdAtDisplay: formatDateTime(locale, row.created_at, emptyDisplay),
    actorName,
    kind: classifyAuditKind(
      String(row.domain ?? ""),
      String(row.resource_type ?? ""),
      String(row.action ?? ""),
    ),
    action: String(row.action ?? ""),
    summary: String(row.summary ?? ""),
    changes: extractChanges(row.before_values, row.after_values, row.diff, emptyDisplay),
  };
}
