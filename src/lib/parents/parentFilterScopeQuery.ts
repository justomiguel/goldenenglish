import type { ParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";
import { adminDirectoryFiltersToParams } from "@/lib/dashboard/adminDirectoryFilters";

export function parentFilterScopeQuery(
  scope: Extract<ParentRecipientScope, { kind: "filter" }>,
): Record<string, string> {
  return {
    scope: "filter",
    q: scope.q,
    section: scope.section ?? "",
    access: scope.access,
    ...adminDirectoryFiltersToParams({
      phone: scope.phone,
      created: scope.created,
      email: scope.email,
      children: scope.children,
    }),
  };
}
