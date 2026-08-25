"use client";

import type { ReactNode, RefObject } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow, SortKey, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import { Button } from "@/components/atoms/Button";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { UniversalListView } from "@/components/organisms/UniversalListView";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

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
            title={labels.tipSelectAllVisible}
          />
        </th>
      }
      trailingHeader={
        <th
          scope="col"
          className="min-w-0 whitespace-nowrap px-2 py-3 font-semibold text-[var(--color-muted-foreground)]"
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
          tipPrev: tableLabels.paginationTipPrev,
          tipNext: tableLabels.paginationTipNext,
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
                title={isSelf ? labels.selfProtected : labels.tipSelectRow}
              />
            </td>
            <td className="min-w-0 max-w-0 break-words px-2 py-2 align-top">
              <Link
                href={`/${locale}/dashboard/admin/users/${r.id}`}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                {r.email}
              </Link>
            </td>
            <td className="min-w-0 px-2 py-2 align-top">
              <Link
                href={`/${locale}/dashboard/admin/users/${r.id}`}
                title={labels.tipOpenUserProfile}
                className="flex items-start gap-2 text-[var(--color-foreground)] hover:underline"
              >
                <ProfileAvatar
                  url={r.avatarDisplayUrl}
                  displayName={formatProfileNameSurnameFirst(r.firstName, r.lastName)}
                  size="sm"
                />
                <span className="flex min-w-0 flex-wrap items-center gap-1.5 break-words">
                  <span>{formatProfileNameSurnameFirst(r.firstName, r.lastName)}</span>
                  {r.missingSection ? (
                    <span
                      className="inline-flex shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-sky-800"
                      title={labels.noSectionBadgeAria}
                    >
                      {labels.noSectionBadge}
                    </span>
                  ) : null}
                </span>
              </Link>
            </td>
            <td className="min-w-0 break-words px-2 py-2 align-top">
              <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-sky-800">
                {r.role}
              </span>
            </td>
            <td className="min-w-0 break-words px-2 py-2 align-top text-[var(--color-foreground)]">
              {r.phone}
            </td>
            <td className="min-w-0 px-2 py-2 align-top whitespace-nowrap">
              <div className="flex items-center gap-1">
                <Link
                  href={`/${locale}/dashboard/admin/users/${r.id}`}
                  title={labels.tipViewOne}
                  aria-label={`${labels.viewOne}: ${r.email}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)]"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href={`/${locale}/dashboard/admin/users/${r.id}`}
                  title={labels.tipEditOne}
                  aria-label={`${labels.editOne}: ${r.email}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 min-h-10 rounded-xl p-0 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  disabled={isSelf || busy}
                  title={isSelf ? labels.selfProtected : labels.tipDeleteOneRow}
                  onClick={() => onRequestDeleteOne(r.id)}
                  aria-label={`${labels.deleteOne}: ${r.email}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </UniversalListView>
  );
}
