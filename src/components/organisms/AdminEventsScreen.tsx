"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChartNoAxesColumn, Settings2, Users } from "lucide-react";
import type { AdminEventRow } from "@/lib/dashboard/events/loadPaginatedAdminEvents";
import { TablePagination } from "@/components/molecules/TablePagination";
import type { EventSortKey } from "@/lib/dashboard/events/loadPaginatedAdminEvents";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminEventPriceCell } from "@/components/molecules/AdminEventPriceCell";
import { SortableTh } from "@/components/molecules/SortableTh";
import { AdminEventListCard } from "@/components/dashboard/admin/events/AdminEventListCard";
import { AdminEventsMobileSort } from "@/components/dashboard/admin/events/AdminEventsMobileSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";

interface AdminEventsScreenProps {
  locale: string;
  rows: AdminEventRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: EventSortKey;
  dir: "asc" | "desc";
  labels: {
    countSuffix: string;
    create: string;
    title: string;
    creator: string;
    date: string;
    status: string;
    capacity: string;
    views: string;
    price: string;
    actions: string;
    manage: string;
    empty: string;
    free: string;
    paginationPrev: string;
    paginationNext: string;
    paginationSummary: string;
    paginationTipPrev: string;
    paginationTipNext: string;
  };
}

function nextSortDir(currentSort: EventSortKey, currentDir: "asc" | "desc", target: EventSortKey) {
  if (currentSort !== target) return "asc";
  return currentDir === "asc" ? "desc" : "asc";
}

export function AdminEventsScreen({
  locale,
  rows,
  totalCount,
  page,
  pageSize,
  sort,
  dir,
  labels,
}: AdminEventsScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };
  const sortHref = (key: EventSortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("dir", nextSortDir(sort, dir, key));
    params.set("page", "1");
    return `${pathname}?${params.toString()}`;
  };
  const sortLabels = tableSortLabels(locale);
  const onToggleSort = (key: string) => {
    router.push(sortHref(key as EventSortKey));
  };
  const headClass = "px-3 py-2";

  return (
    <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {totalCount} {labels.countSuffix}
        </p>
        <AdminEventsMobileSort sort={sort} dir={dir} labels={labels} />
        <Link
          href={`/${locale}/dashboard/admin/events/new`}
          data-tour={ADMIN_TOUR_ANCHORS.eventsCreateCta}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
        >
          <Calendar className="h-4 w-4" aria-hidden />
          {labels.create}
        </Link>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <AdminEventListCard
            key={row.id}
            locale={locale}
            row={row}
            manageLabel={labels.manage}
            freeLabel={labels.free}
          />
        ))}
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
        ) : null}
      </div>
      <div className="hidden overflow-x-auto md:block" data-tour={ADMIN_TOUR_ANCHORS.eventsTable}>
        <table className="ge-stack-cards min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              <SortableTh
                columnId="title"
                label={labels.title}
                sortKey={sort}
                sortDir={dir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={headClass}
              />
              <th className={`${headClass} font-semibold text-[var(--color-muted-foreground)]`} scope="col">
                {labels.creator}
              </th>
              <SortableTh
                columnId="event_date"
                label={labels.date}
                sortKey={sort}
                sortDir={dir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={headClass}
              />
              <SortableTh
                columnId="status"
                label={labels.status}
                sortKey={sort}
                sortDir={dir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={headClass}
              />
              <SortableTh
                columnId="attendees_count"
                label={labels.capacity}
                sortKey={sort}
                sortDir={dir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={headClass}
              />
              <SortableTh
                columnId="views"
                label={labels.views}
                sortKey={sort}
                sortDir={dir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={headClass}
              />
              <SortableTh
                columnId="price"
                label={labels.price}
                sortKey={sort}
                sortDir={dir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={headClass}
              />
              <th className="px-3 py-2 font-semibold text-[var(--color-muted-foreground)]">{labels.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--color-border)]">
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{row.createdByName}</td>
                <td className="px-3 py-2">{new Date(row.eventDate).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-sky-800">
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {row.attendeesCount}/{row.capacity}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <ChartNoAxesColumn className="h-3.5 w-3.5" aria-hidden />
                    {row.viewCount.toLocaleString()}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <AdminEventPriceCell
                    priceByFlow={row.priceByFlow}
                    flowPrices={row.flowPrices}
                    price={row.price}
                    currency={row.currency}
                    locale={locale}
                    freeLabel={labels.free}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/${locale}/dashboard/admin/events/${row.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-foreground)]"
                  >
                    <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
                    {labels.manage}
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-[var(--color-muted-foreground)]" colSpan={8}>
                  {labels.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        labels={{
          prev: labels.paginationPrev,
          next: labels.paginationNext,
          summary: labels.paginationSummary,
          tipPrev: labels.paginationTipPrev,
          tipNext: labels.paginationTipNext,
        }}
      />
    </section>
  );
}
