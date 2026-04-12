"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { deleteAdminUsers } from "@/app/[locale]/dashboard/admin/users/deleteActions";
import {
  ROLE_FILTER_ALL,
  applyUserRowToggle,
  filterAdminUsers,
  sortAdminUsers,
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
  locale: string;
  currentUserId: string;
  labels: UserLabels;
}

export function useAdminUsersTable({
  rows,
  locale,
  currentUserId,
  labels,
}: UseAdminUsersTableParams) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ROLE_FILTER_ALL);
  /** Single object so Strict Mode does not double-flip dir (nested setSortDir inside setSortKey was cancelling toggles). */
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "email",
    dir: "asc",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const pageSize = DEFAULT_TABLE_PAGE_SIZE;

  const filtered = useMemo(
    () => filterAdminUsers(rows, query, roleFilter),
    [rows, query, roleFilter],
  );

  const sorted = useMemo(
    () => sortAdminUsers(filtered, sort.key, sort.dir),
    [filtered, sort.key, sort.dir],
  );

  const maxPage = Math.max(1, Math.ceil(sorted.length / pageSize) || 1);
  const effectivePage = Math.min(page, maxPage);

  const pageRows = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, effectivePage, pageSize]);

  const deletableVisible = useMemo(
    () => sorted.filter((r) => r.id !== currentUserId),
    [sorted, currentUserId],
  );

  const selectedDeletable = useMemo(() => {
    return deletableVisible.filter((r) => selectedIds.has(r.id));
  }, [deletableVisible, selectedIds]);

  const allVisibleSelected =
    deletableVisible.length > 0 &&
    selectedDeletable.length === deletableVisible.length;

  const someSelected = selectedDeletable.length > 0 && !allVisibleSelected;

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = someSelected;
  }, [someSelected]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sort.key !== key) {
        setPage(1);
      }
      setSort((prev) => {
        if (prev.key === key) {
          return { ...prev, dir: prev.dir === "asc" ? "desc" : "asc" };
        }
        return { key, dir: "asc" };
      });
    },
    [sort.key],
  );

  const setQueryAndResetPage = useCallback((v: string) => {
    setQuery(v);
    setPage(1);
  }, []);

  const setRoleFilterAndResetPage = useCallback((v: string) => {
    setRoleFilter(v);
    setPage(1);
  }, []);

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

  const hasActiveFilter = query.trim().length > 0 || roleFilter !== ROLE_FILTER_ALL;
  const emptyMessage = hasActiveFilter ? labels.noFilterResults : labels.emptyList;

  return {
    query,
    setQuery: setQueryAndResetPage,
    roleFilter,
    setRoleFilter: setRoleFilterAndResetPage,
    sortKey: sort.key,
    sortDir: sort.dir,
    toggleSort,
    selectedIds,
    toggleRow,
    toggleSelectAllVisible,
    confirmIds,
    setConfirmIds,
    busy,
    selectAllRef,
    filtered,
    sorted,
    page: effectivePage,
    setPage,
    pageSize,
    pageRows,
    listEmpty: sorted.length === 0,
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
