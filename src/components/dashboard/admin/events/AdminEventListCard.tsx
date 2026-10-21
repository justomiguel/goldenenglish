import Link from "next/link";
import { ChartNoAxesColumn, Settings2, Users } from "lucide-react";
import { AdminEventPriceCell } from "@/components/molecules/AdminEventPriceCell";
import type { AdminEventRow } from "@/lib/dashboard/events/loadPaginatedAdminEvents";

interface AdminEventListCardProps {
  locale: string;
  row: AdminEventRow;
  manageLabel: string;
  freeLabel: string;
}

export function AdminEventListCard({ locale, row, manageLabel, freeLabel }: AdminEventListCardProps) {
  const when = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(row.eventDate));

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold text-[var(--color-foreground)]">{row.title}</h3>
        <span className="inline-flex shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-sky-800">
          {row.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{when}</p>
      <p className="mt-0.5 text-sm text-[var(--color-foreground)]">{row.createdByName}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-foreground)]">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {row.attendeesCount}/{row.capacity}
        </span>
        <span className="inline-flex items-center gap-1">
          <ChartNoAxesColumn className="h-3.5 w-3.5" aria-hidden />
          {row.viewCount.toLocaleString(locale)}
        </span>
        <AdminEventPriceCell
          priceByFlow={row.priceByFlow}
          flowPrices={row.flowPrices}
          price={row.price}
          currency={row.currency}
          locale={locale}
          freeLabel={freeLabel}
        />
      </div>
      <Link
        href={`/${locale}/dashboard/admin/events/${row.id}`}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
      >
        <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
        {manageLabel}
      </Link>
    </article>
  );
}
