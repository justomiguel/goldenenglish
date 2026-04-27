"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AuditDomain } from "@/lib/audit/types";
import type { AdminAuditRow, AuditSortDir, AuditSortKey } from "@/types/audit";

export interface UseAdminAuditLogParams {
  rows: AdminAuditRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  domainFilter: AuditDomain | "all";
  actionFilter: string;
  resourceTypeFilter: string;
  dateFrom: string;
  dateTo: string;
  actorIdFilter: string;
  sortKey: AuditSortKey;
  sortDir: AuditSortDir;
  emptyList: string;
  noFilterResults: string;
}

export function useAdminAuditLog({
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  domainFilter,
  actionFilter,
  resourceTypeFilter,
  dateFrom,
  dateTo,
  actorIdFilter,
  sortKey,
  sortDir,
  emptyList,
  noFilterResults,
}: UseAdminAuditLogParams) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [detailsRow, setDetailsRow] = useState<AdminAuditRow | null>(null);

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(currentParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) sp.delete(key);
        else sp.set(key, value);
      }
      const qs = sp.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [currentParams, pathname, router],
  );

  const setQuery = useCallback(
    (q: string) => pushParams({ q, page: undefined }),
    [pushParams],
  );
  const setDomain = useCallback(
    (domain: string) => pushParams({ domain: domain === "all" ? undefined : domain, page: undefined }),
    [pushParams],
  );
  const setAction = useCallback(
    (action: string) => pushParams({ action, page: undefined }),
    [pushParams],
  );
  const setResourceType = useCallback(
    (resourceType: string) => pushParams({ resourceType, page: undefined }),
    [pushParams],
  );
  const setDateFrom = useCallback(
    (from: string) => pushParams({ from, page: undefined }),
    [pushParams],
  );
  const setDateTo = useCallback(
    (to: string) => pushParams({ to, page: undefined }),
    [pushParams],
  );
  const setActorId = useCallback(
    (actor: string) => pushParams({ actor, page: undefined }),
    [pushParams],
  );
  const clearExtraFilters = useCallback(() => {
    pushParams({
      from: undefined,
      to: undefined,
      actor: undefined,
      page: undefined,
    });
  }, [pushParams]);
  const setPage = useCallback(
    (nextPage: number) => pushParams({ page: nextPage > 1 ? String(nextPage) : undefined }),
    [pushParams],
  );
  const toggleSort = useCallback(
    (id: string) => {
      const key = id as AuditSortKey;
      const newDir: AuditSortDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
      pushParams({ sort: key, dir: newDir, page: undefined });
    },
    [pushParams, sortDir, sortKey],
  );

  const hasFilters = Boolean(
    searchQuery.trim() ||
      domainFilter !== "all" ||
      actionFilter.trim() ||
      resourceTypeFilter.trim() ||
      dateFrom.trim() ||
      dateTo.trim() ||
      actorIdFilter.trim(),
  );
  const listEmpty = totalCount === 0;

  return {
    rows,
    totalCount,
    page,
    pageSize,
    sortKey,
    sortDir,
    searchQuery,
    domainFilter,
    actionFilter,
    resourceTypeFilter,
    dateFrom,
    dateTo,
    actorIdFilter,
    detailsRow,
    setDetailsRow,
    setQuery,
    setDomain,
    setAction,
    setResourceType,
    setDateFrom,
    setDateTo,
    setActorId,
    clearExtraFilters,
    setPage,
    toggleSort,
    isPending,
    listEmpty,
    emptyMessage: hasFilters ? noFilterResults : emptyList,
  };
}
