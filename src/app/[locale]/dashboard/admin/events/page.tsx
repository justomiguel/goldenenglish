import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminEventsScreen } from "@/components/organisms/AdminEventsScreen";
import { loadPaginatedAdminEvents, type EventSortKey } from "@/lib/dashboard/events/loadPaginatedAdminEvents";
import { loadAdminEventsListAggregates } from "@/lib/dashboard/events/loadAdminEventsListAggregates";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminEventsPage({ params, searchParams }: PageProps) {
  await assertAdmin();
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);
  const q = String(sp.q ?? "");
  const sort = (["title", "event_date", "attendees_count"] as const).includes(
    String(sp.sort ?? "event_date") as EventSortKey,
  )
    ? (String(sp.sort ?? "event_date") as EventSortKey)
    : "event_date";
  const dir = String(sp.dir ?? "asc") === "desc" ? "desc" : "asc";
  const admin = createAdminClient();

  const [result, counts] = await Promise.all([
    loadPaginatedAdminEvents(admin, { page, q, sort, dir }),
    loadAdminEventsListAggregates(admin, q),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.dashboard.adminNav.events}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.admin.events.lead}
      </p>
      <div className="mt-3 text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.events.kpis.upcoming}: {counts.totalUpcoming} · {dict.admin.events.kpis.waitlist}: {counts.totalWaitlist}
      </div>
      <AdminEventsScreen
        locale={locale}
        rows={result.rows}
        totalCount={result.totalCount}
        page={result.page}
        pageSize={result.pageSize}
        sort={sort}
        dir={dir}
        labels={{
          countSuffix: dict.admin.events.list.countSuffix,
          create: dict.admin.events.list.create,
          title: dict.admin.events.list.columns.title,
          date: dict.admin.events.list.columns.date,
          status: dict.admin.events.list.columns.status,
          capacity: dict.admin.events.list.columns.capacity,
          views: dict.admin.events.list.columns.views,
          price: dict.admin.events.list.columns.price,
          actions: dict.admin.events.list.columns.actions,
          manage: dict.admin.events.list.manage,
          empty: dict.admin.events.list.empty,
          free: dict.admin.events.list.free,
          paginationPrev: dict.admin.table.paginationPrev,
          paginationNext: dict.admin.table.paginationNext,
          paginationSummary: dict.admin.table.paginationSummary,
          paginationTipPrev: dict.admin.table.paginationTipPrev,
          paginationTipNext: dict.admin.table.paginationTipNext,
        }}
      />
    </div>
  );
}
