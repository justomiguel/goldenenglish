"use client";

import { AdminAuditDetailsModal } from "@/components/dashboard/AdminAuditDetailsModal";
import { AdminAuditTableRow } from "@/components/dashboard/AdminAuditTableRow";
import { AdminAuditToolbar } from "@/components/molecules/AdminAuditToolbar";
import { UniversalListView } from "@/components/organisms/UniversalListView";
import { useAdminAuditLog } from "@/hooks/useAdminAuditLog";
import type { AuditDomain } from "@/lib/audit/types";
import type { AdminAuditRow, AuditSortDir, AuditSortKey } from "@/types/audit";
import type { Dictionary } from "@/types/i18n";

type AuditLabels = Dictionary["admin"]["audit"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminAuditLogScreenProps {
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
  locale: string;
  labels: AuditLabels;
  tableLabels: TableLabels;
}

export function AdminAuditLogScreen(props: AdminAuditLogScreenProps) {
  const u = useAdminAuditLog({
    rows: props.rows,
    totalCount: props.totalCount,
    page: props.page,
    pageSize: props.pageSize,
    searchQuery: props.searchQuery,
    domainFilter: props.domainFilter,
    actionFilter: props.actionFilter,
    resourceTypeFilter: props.resourceTypeFilter,
    dateFrom: props.dateFrom,
    dateTo: props.dateTo,
    actorIdFilter: props.actorIdFilter,
    sortKey: props.sortKey,
    sortDir: props.sortDir,
    emptyList: props.labels.emptyList,
    noFilterResults: props.labels.noFilterResults,
  });
  const hdr = "px-3 py-2 text-xs uppercase text-[var(--color-muted-foreground)]";

  return (
    <div className="mt-6 space-y-4">
      <UniversalListView
        toolbar={
          <AdminAuditToolbar
            labels={props.labels}
            query={u.searchQuery}
            domain={u.domainFilter}
            action={u.actionFilter}
            resourceType={u.resourceTypeFilter}
            isPending={u.isPending}
            onQueryChange={u.setQuery}
            onDomainChange={u.setDomain}
            onActionChange={u.setAction}
            onResourceTypeChange={u.setResourceType}
            dateFrom={u.dateFrom}
            dateTo={u.dateTo}
            actorId={u.actorIdFilter}
            onDateFromChange={u.setDateFrom}
            onDateToChange={u.setDateTo}
            onActorIdChange={u.setActorId}
            onClearDateAndActor={u.clearExtraFilters}
            canClearDateAndActor={Boolean(
              u.dateFrom.trim() || u.dateTo.trim() || u.actorIdFilter.trim(),
            )}
          />
        }
        columns={[
          { id: "created_at", label: props.labels.colWhen, thClassName: hdr },
          { id: "actor", label: props.labels.colActor, thClassName: hdr },
          { id: "domain", label: props.labels.colDomain, thClassName: hdr },
          { id: "action", label: props.labels.colAction, thClassName: hdr },
          { id: "resource", label: props.labels.colResource, thClassName: hdr },
          { id: "summary", label: props.labels.colSummary, thClassName: hdr, sortable: false },
        ]}
        sortKey={u.sortKey}
        sortDir={u.sortDir}
        onToggleSort={u.toggleSort}
        sortLabels={{
          sortAsc: props.tableLabels.sortAsc,
          sortDesc: props.tableLabels.sortDesc,
          sortNeutral: props.tableLabels.sortNeutral,
        }}
        trailingHeader={<th scope="col" className={hdr}>{props.labels.colDetails}</th>}
        pagination={
          u.listEmpty
            ? undefined
            : {
                page: u.page,
                pageSize: u.pageSize,
                totalCount: u.totalCount,
                onPageChange: u.setPage,
                labels: {
                  prev: props.tableLabels.paginationPrev,
                  next: props.tableLabels.paginationNext,
                  summary: props.tableLabels.paginationSummary,
                  tipPrev: props.tableLabels.paginationTipPrev,
                  tipNext: props.tableLabels.paginationTipNext,
                },
              }
        }
        emptyMessage={u.emptyMessage}
        isEmpty={u.listEmpty}
        minTableWidth="min-w-[72rem]"
      >
        {u.rows.map((row) => (
          <AdminAuditTableRow
            key={row.id}
            row={row}
            labels={props.labels}
            locale={props.locale}
            onOpenDetails={u.setDetailsRow}
          />
        ))}
      </UniversalListView>
      <AdminAuditDetailsModal
        row={u.detailsRow}
        labels={props.labels}
        onClose={() => u.setDetailsRow(null)}
      />
    </div>
  );
}
