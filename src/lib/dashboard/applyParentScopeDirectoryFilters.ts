import type { AdminDirectoryFilters } from "@/lib/dashboard/adminDirectoryFilters";
import { buildAdminDirectoryCandidates } from "@/lib/dashboard/buildAdminDirectoryCandidates";
import { filterAdminDirectoryCandidates } from "@/lib/dashboard/matchAdminDirectoryCandidate";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import type { ParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";

export type ParentScopeProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string | null;
  last_session_start_at: string | null;
};

export function parentScopePostFilters(
  scope: Extract<ParentRecipientScope, { kind: "filter" }>,
): AdminDirectoryFilters {
  return {
    phone: scope.phone,
    created: scope.created,
    email: scope.email,
    children: scope.children,
  };
}

export function applyParentScopeDirectoryFilters(
  profiles: ParentScopeProfile[],
  scope: Extract<ParentRecipientScope, { kind: "filter" }>,
  extras: {
    childrenByParent: Map<string, { id: string }[]>;
    emailById: Map<string, string>;
  },
  now?: Date,
): ParentScopeProfile[] {
  const filters = parentScopePostFilters(scope);
  if (!filters.phone && !filters.created && !filters.email && !filters.children) {
    return profiles;
  }
  const deliverable = new Map<string, boolean>();
  for (const [id, raw] of extras.emailById) {
    deliverable.set(id, isDeliverableAuthEmail(raw));
  }
  const candidates = buildAdminDirectoryCandidates({
    profiles,
    childrenByParent: extras.childrenByParent,
    emailDeliverableById: deliverable,
  });
  const matched = new Set(
    filterAdminDirectoryCandidates(candidates, filters, { now }).map((row) => row.id),
  );
  return profiles.filter((profile) => matched.has(profile.id));
}
