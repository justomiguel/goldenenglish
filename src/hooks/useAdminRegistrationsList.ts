"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { deleteRegistration } from "@/app/[locale]/dashboard/admin/registrations/actions";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import {
  filterRegistrationRows,
  sortRegistrationRows,
  type RegistrationSortDir,
  type RegistrationSortKey,
} from "@/lib/dashboard/adminRegistrationsSort";

type RegLabels = Dictionary["admin"]["registrations"];

export interface UseAdminRegistrationsListParams {
  locale: string;
  rows: AdminRegistrationRow[];
  labels: RegLabels;
}

export function useAdminRegistrationsList({
  locale,
  rows,
  labels,
}: UseAdminRegistrationsListParams) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteRow, setDeleteRow] = useState<AdminRegistrationRow | null>(null);
  const [acceptRow, setAcceptRow] = useState<AdminRegistrationRow | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState<RegistrationSortKey>("received");
  const [sortDir, setSortDir] = useState<RegistrationSortDir>("desc");
  const [page, setPage] = useState(1);

  const setFilterQueryAndResetPage = useCallback((v: string) => {
    setFilterQuery(v);
    setPage(1);
  }, []);

  const filtered = useMemo(
    () => filterRegistrationRows(rows, filterQuery),
    [rows, filterQuery],
  );

  const sorted = useMemo(
    () => sortRegistrationRows(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  const maxPage = Math.max(1, Math.ceil(sorted.length / DEFAULT_TABLE_PAGE_SIZE) || 1);
  const effectivePage = Math.min(page, maxPage);

  const pageRows = useMemo(() => {
    const start = (effectivePage - 1) * DEFAULT_TABLE_PAGE_SIZE;
    return sorted.slice(start, start + DEFAULT_TABLE_PAGE_SIZE);
  }, [sorted, effectivePage]);

  const toggleSort = useCallback((id: string) => {
    const key = id as RegistrationSortKey;
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setPage(1);
      setSortDir("asc");
      return key;
    });
  }, []);

  const statusLabel = useCallback(
    (status: string) => {
      if (status === "new") return labels.new;
      if (status === "enrolled") return labels.enrolled;
      if (status === "contacted") return labels.contacted;
      return status;
    },
    [labels],
  );

  const listEmpty = filtered.length === 0;
  const emptyMessage =
    listEmpty && filterQuery.trim() ? labels.noFilterResults : labels.none;

  function refreshList() {
    router.refresh();
  }

  async function onConfirmDelete() {
    if (!deleteRow) return;
    setBusyId(deleteRow.id);
    setToast(null);
    const res = await deleteRegistration(locale, deleteRow.id);
    setBusyId(null);
    setDeleteRow(null);
    if (res.ok) {
      setToast(labels.deleteSuccess);
      refreshList();
    } else {
      setToast(`${labels.deleteError}: ${res.message ?? ""}`);
    }
  }

  return {
    busyId,
    setBusyId,
    toast,
    setToast,
    deleteRow,
    setDeleteRow,
    acceptRow,
    setAcceptRow,
    filterQuery,
    setFilterQueryAndResetPage,
    sortKey,
    sortDir,
    toggleSort,
    page: effectivePage,
    setPage,
    rows,
    filtered,
    sorted,
    pageRows,
    listEmpty,
    emptyMessage,
    statusLabel,
    onConfirmDelete,
    refreshList,
  };
}
