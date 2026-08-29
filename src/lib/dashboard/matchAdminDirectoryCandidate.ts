import type {
  AdminDirectoryCandidate,
  AdminDirectoryFilterKey,
  AdminDirectoryFilters,
  DirectoryBinaryFilter,
} from "@/lib/dashboard/adminDirectoryFilters";

export type MatchAdminDirectoryOptions = {
  now?: Date;
  omit?: AdminDirectoryFilterKey;
};

function hasPhone(candidate: AdminDirectoryCandidate): boolean {
  return candidate.phone.trim().length > 0;
}

function createdCutoff(now: Date): Date {
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 30);
  return since;
}

function isLast30(candidate: AdminDirectoryCandidate, now: Date): boolean {
  if (!candidate.createdAt) return false;
  const created = Date.parse(candidate.createdAt);
  if (!Number.isFinite(created)) return false;
  return created >= createdCutoff(now).getTime();
}

function matchBinary(flag: boolean, filter: DirectoryBinaryFilter | undefined): boolean {
  if (!filter) return true;
  return filter === "with" ? flag : !flag;
}

function teachingPool(
  candidate: AdminDirectoryCandidate,
  teachingRole: AdminDirectoryFilters["teachingRole"],
): string[] {
  if (teachingRole === "lead") return candidate.leadSectionIds;
  if (teachingRole === "assistant") return candidate.assistantSectionIds;
  return candidate.sectionIds;
}

export function matchAdminDirectoryCandidate(
  candidate: AdminDirectoryCandidate,
  filters: AdminDirectoryFilters,
  options: MatchAdminDirectoryOptions = {},
): boolean {
  const now = options.now ?? new Date();
  const omit = options.omit;
  const access = omit === "access" ? undefined : filters.access;
  const phone = omit === "phone" ? undefined : filters.phone;
  const created = omit === "created" ? undefined : filters.created;
  const enrollment = omit === "enrollment" ? undefined : filters.enrollment;
  const teachingRole = omit === "teachingRole" ? undefined : filters.teachingRole;
  const section = omit === "section" ? undefined : filters.section;
  const parentLink = omit === "parentLink" ? undefined : filters.parentLink;
  const scholarship = omit === "scholarship" ? undefined : filters.scholarship;
  const due = omit === "due" ? undefined : filters.due;
  const email = omit === "email" ? undefined : filters.email;
  const children = omit === "children" ? undefined : filters.children;

  if (access === "never" && candidate.lastSessionStartAt) return false;
  if (access === "entered" && !candidate.lastSessionStartAt) return false;
  if (!matchBinary(hasPhone(candidate), phone)) return false;
  if (created === "last30" && !isLast30(candidate, now)) return false;
  if (created === "older" && isLast30(candidate, now)) return false;
  if (!matchBinary(candidate.sectionIds.length > 0, enrollment)) return false;
  if (!matchBinary(candidate.hasParentLink, parentLink)) return false;
  if (!matchBinary(candidate.hasScholarship, scholarship)) return false;
  if (!matchBinary(candidate.hasDue, due)) return false;
  if (email === "deliverable" && !candidate.emailDeliverable) return false;
  if (email === "none" && candidate.emailDeliverable) return false;
  if (!matchBinary(candidate.hasChildren, children)) return false;

  const pool = teachingPool(candidate, teachingRole);
  if (teachingRole && pool.length === 0) return false;
  if (section && !pool.includes(section)) return false;
  return true;
}

export function filterAdminDirectoryCandidates(
  candidates: AdminDirectoryCandidate[],
  filters: AdminDirectoryFilters,
  options: MatchAdminDirectoryOptions = {},
): AdminDirectoryCandidate[] {
  return candidates.filter((candidate) => matchAdminDirectoryCandidate(candidate, filters, options));
}
