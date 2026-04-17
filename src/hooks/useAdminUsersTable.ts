"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { deleteAdminUsers } from "@/app/[locale]/dashboard/admin/users/deleteActions";
import {
  ROLE_FILTER_ALL,
  applyUserRowToggle,
  type AdminUserRow,
  type SortDir,
  type SortKey,
} from "@/lib/dashboard/adminUsersTableHelpers";

type UserLabels = Dictionary["admin"]["users"];

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export interface UseAdminUsersTableParams {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
  sortKey: SortKey;
  sortDir: SortDir;
  locale: string;
  currentUserId: string;
  labels: UserLabels;
}

export function useAdminUsersTable({
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  roleFilter,
  sortKey,
  sortDir,
  locale,
  currentUserId,
  labels,
}: UseAdminUsersTableParams) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(currentParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") {
          sp.delete(k);
        } else {
          sp.set(k, v);
        }
      }
      const qs = sp.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [currentParams, pathname, router],
  );

  const setQuery = useCallback(
    (q: string) => pushParams({ q: q || undefined, page: undefined }),
    [pushParams],
  );

  const setRoleFilter = useCallback(
    (role: string) => {
      const val = role === ROLE_FILTER_ALL ? undefined : role;
      pushParams({ role: val, page: undefined });
    },
    [pushParams],
  );

  const toggleSort = useCallback(
    (key: SortKey) => {
      const newDir: SortDir =
        sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc";
      pushParams({ sort: key, dir: newDir, page: undefined });
    },
    [pushParams, sortKey, sortDir],
  );

  const setPage = useCallback(
    (p: number) => pushParams({ page: p > 1 ? String(p) : undefined }),
    [pushParams],
  );

  const deletableVisible = useMemo(
    () => rows.filter((r) => r.id !== currentUserId),
    [rows, currentUserId],
  );

  const selectedDeletable = useMemo(
    () => deletableVisible.filter((r) => selectedIds.has(r.id)),
    [deletableVisible, selectedIds],
  );

  const allVisibleSelected =
    deletableVisible.length > 0 &&
    selectedDeletable.length === deletableVisible.length;

  const someSelected = selectedDeletable.length > 0 && !allVisibleSelected;

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = someSelected;
  }, [someSelected]);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => applyUserRowToggle(prev, id, currentUserId));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(deletableVisible.map((r) => r.id)));
  };

  async function runDelete(ids: string[]) {
    setBusy(true);
    const res = await deleteAdminUsers(locale, ids);
    setBusy(false);
    setConfirmIds(null);
    if (res.ok) {
      setSelectedIds(new Set());
      router.refresh();
      if (res.partial) {
        window.alert(labels.deletePartial);
      }
      return;
    }
    if (res.message) {
      window.alert(`${labels.deleteError}: ${res.message}`);
    }
  }

  const hasActiveFilter =
    searchQuery.trim().length > 0 || roleFilter !== ROLE_FILTER_ALL;
  const emptyMessage = hasActiveFilter ? labels.noFilterResults : labels.emptyList;
  const listEmpty = totalCount === 0;

  return {
    query: searchQuery,
    setQuery,
    roleFilter,
    setRoleFilter,
    sortKey,
    sortDir,
    toggleSort,
    selectedIds,
    toggleRow,
    toggleSelectAllVisible,
    confirmIds,
    setConfirmIds,
    busy,
    selectAllRef,
    filtered: rows,
    sorted: rows,
    page,
    setPage,
    pageSize,
    pageRows: rows,
    totalCount,
    listEmpty,
    deletableVisible,
    selectedDeletable,
    allVisibleSelected,
    runDelete,
    emptyMessage,
    onDeleteSelected: () => setConfirmIds(selectedDeletable.map((r) => r.id)),
    deleteDisabled: selectedDeletable.length === 0 || busy,
    selectAllFilteredDisabled: deletableVisible.length === 0 || busy,
    tpl,
  };
}
