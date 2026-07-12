export type UsersExportMode = "template" | "data";
export type UsersExportFallback = "filter" | "all";

export type UsersExportScope =
  | { kind: "template" }
  | { kind: "ids"; ids: string[] }
  | { kind: "filter" }
  | { kind: "all" };

export function resolveUsersExportScope(input: {
  mode: UsersExportMode;
  selectedIds: string[];
  fallback: UsersExportFallback;
}): UsersExportScope {
  if (input.mode === "template") return { kind: "template" };
  if (input.selectedIds.length > 0) {
    return { kind: "ids", ids: [...input.selectedIds] };
  }
  return input.fallback === "all" ? { kind: "all" } : { kind: "filter" };
}
