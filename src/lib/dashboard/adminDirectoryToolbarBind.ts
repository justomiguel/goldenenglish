import {
  adminDirectoryFiltersToParams,
  clearedDirectoryFilterParams,
  type AdminDirectoryFilters,
} from "@/lib/dashboard/adminDirectoryFilters";
import type { AdminDirectoryFilterKey } from "@/lib/dashboard/adminDirectoryFilters";

export function bindDirectoryFilterChange(
  replaceParams: (updates: Record<string, string | undefined>) => void,
): (key: AdminDirectoryFilterKey, value: string | undefined) => void {
  return (key, value) => replaceParams({ [key]: value, page: undefined });
}

export function bindDirectoryFilterClear(
  replaceParams: (updates: Record<string, string | undefined>) => void,
): () => void {
  return () => replaceParams({ ...clearedDirectoryFilterParams(), page: undefined });
}

export function parentComposeFilterQuery(
  query: string,
  values: AdminDirectoryFilters,
): string {
  const params = new URLSearchParams({
    scope: "filter",
    q: query,
    access: values.access ?? "all",
    ...adminDirectoryFiltersToParams(values),
  });
  if (!values.section) params.set("section", "");
  return params.toString();
}
