"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteRegistration } from "@/app/[locale]/dashboard/admin/registrations/actions";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type {
  RegistrationSortDir,
  RegistrationSortKey,
} from "@/lib/dashboard/adminRegistrationsSort";

type RegLabels = Dictionary["admin"]["registrations"];

export interface UseAdminRegistrationsListParams {
  locale: string;
  rows: AdminRegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  labels: RegLabels;
}

export function useAdminRegistrationsList({
  locale,
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  sortKey,
  sortDir,
  labels,
}: UseAdminRegistrationsListParams) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteRow, setDeleteRow] = useState<AdminRegistrationRow | null>(null);
  const [acceptRow, setAcceptRow] = useState<AdminRegistrationRow | null>(null);
  const [editRow, setEditRow] = useState<AdminRegistrationRow | null>(null);

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

  const setFilterQuery = useCallback(
    (q: string) => pushParams({ q: q || undefined, page: undefined }),
    [pushParams],
  );

  const toggleSort = useCallback(
    (id: string) => {
      const key = id as RegistrationSortKey;
      const newDir: RegistrationSortDir =
        sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc";
      pushParams({ sort: key, dir: newDir, page: undefined });
    },
    [pushParams, sortKey, sortDir],
  );

  const setPage = useCallback(
    (p: number) => pushParams({ page: p > 1 ? String(p) : undefined }),
    [pushParams],
  );

  const statusLabel = useCallback(
    (status: string) => {
      if (status === "new") return labels.new;
      if (status === "enrolled") return labels.enrolled;
      if (status === "contacted") return labels.contacted;
      return labels.statusUnknown;
    },
    [labels],
  );

  const listEmpty = totalCount === 0;
  const emptyMessage =
    listEmpty && searchQuery.trim() ? labels.noFilterResults : labels.none;

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
    editRow,
    setEditRow,
    filterQuery: searchQuery,
    setFilterQueryAndResetPage: setFilterQuery,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageRows: rows,
    totalCount,
    pageSize,
    listEmpty,
    emptyMessage,
    statusLabel,
    onConfirmDelete,
    refreshList,
    isPending,
  };
}
