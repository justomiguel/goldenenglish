"use client";

import type { ReactNode, RefObject } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow, SortKey, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import { Button } from "@/components/atoms/Button";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { UniversalListView } from "@/components/organisms/UniversalListView";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

export interface AdminUsersDataTableProps {
  toolbar: ReactNode;
  locale: string;
  labels: UserLabels;
  tableLabels: TableLabels;
  rows: AdminUserRow[];
  currentUserId: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  selectAllRef: RefObject<HTMLInputElement | null>;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  deletableVisibleCount: number;
  busy: boolean;
  onRequestDeleteOne: (id: string) => void;
  emptyMessage: string;
  /** True when the full filtered list is empty (not only the current page). */
  listEmpty: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
}

export function AdminUsersDataTable({
  toolbar,
  locale,
  labels,
  tableLabels,
  rows,
  currentUserId,
  sortKey,
  sortDir,
  onToggleSort,
  selectedIds,
  onToggleRow,
  selectAllRef,
  allVisibleSelected,
  onToggleSelectAllVisible,
  deletableVisibleCount,
  busy,
  onRequestDeleteOne,
  emptyMessage,
  listEmpty,
  pagination,
}: AdminUsersDataTableProps) {
  return (
    <UniversalListView
      toolbar={toolbar}
      columns={[
        {
          id: "email",
          label: labels.colEmail,
          thClassName: "min-w-0 px-2 py-3 align-top",
        },
        {
          id: "name",
          label: labels.colName,
          thClassName: "min-w-0 px-2 py-3 align-top",
        },
        {
          id: "role",
          label: labels.colRole,
          thClassName: "min-w-0 px-2 py-3 align-top",
        },
        {
          id: "phone",
          label: labels.colPhone,
          thClassName: "min-w-0 px-2 py-3 align-top",
        },
      ]}
      sortKey={sortKey}
      sortDir={sortDir}
      onToggleSort={(id) => onToggleSort(id as SortKey)}
      sortLabels={{
        sortAsc: tableLabels.sortAsc,
        sortDesc: tableLabels.sortDesc,
        sortNeutral: tableLabels.sortNeutral,
      }}
      leadingHeader={
        <th scope="col" className="w-10 min-w-0 px-2 py-3">
          <input
            ref={selectAllRef}
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--color-border)]"
            checked={allVisibleSelected}
            onChange={onToggleSelectAllVisible}
            disabled={deletableVisibleCount === 0}
            aria-label={labels.selectAllVisible}
          />
        </th>
      }
      trailingHeader={
        <th
          scope="col"
          className="min-w-0 whitespace-nowrap px-2 py-3 font-semibold text-[var(--color-secondary)]"
        >
          {labels.colActions}
        </th>
      }
      pagination={{
        ...pagination,
        labels: {
          prev: tableLabels.paginationPrev,
          next: tableLabels.paginationNext,
          summary: tableLabels.paginationSummary,
        },
      }}
      emptyMessage={emptyMessage}
      isEmpty={listEmpty}
      minTableWidth="min-w-0"
      tableClassName="table-fixed"
      tableOverflow="hidden"
    >
      {rows.map((r) => {
        const isSelf = r.id === currentUserId;
        const checked = selectedIds.has(r.id);
        return (
          <tr
            key={r.id}
            className="border-b border-[var(--color-border)] last:border-0"
          >
            <td className="px-2 py-2 align-middle">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--color-border)]"
                checked={checked}
                disabled={isSelf}
                onChange={() => onToggleRow(r.id)}
                aria-label={`${labels.selectRow} ${r.email}`}
              />
            </td>
            <td className="min-w-0 max-w-0 break-words px-2 py-2 align-top text-[var(--color-foreground)]">
              {r.email}
            </td>
            <td className="min-w-0 px-2 py-2 align-top">
              <Link
                href={`/${locale}/dashboard/admin/users/${r.id}`}
                className="flex items-start gap-2 text-[var(--color-foreground)] hover:underline"
              >
                <ProfileAvatar
                  url={r.avatarDisplayUrl}
                  displayName={`${r.firstName} ${r.lastName}`}
                  size="sm"
                />
                <span className="min-w-0 break-words">
                  {r.firstName} {r.lastName}
                </span>
              </Link>
            </td>
            <td className="min-w-0 break-words px-2 py-2 align-top capitalize text-[var(--color-foreground)]">
              {r.role}
            </td>
            <td className="min-w-0 break-words px-2 py-2 align-top text-[var(--color-foreground)]">
              {r.phone}
            </td>
            <td className="min-w-0 px-2 py-2 align-top whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[44px] gap-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                disabled={isSelf || busy}
                title={isSelf ? labels.selfProtected : undefined}
                onClick={() => onRequestDeleteOne(r.id)}
                aria-label={`${labels.deleteOne}: ${r.email}`}
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                <span className="sr-only md:not-sr-only">{labels.deleteOne}</span>
              </Button>
            </td>
          </tr>
        );
      })}
    </UniversalListView>
  );
}
