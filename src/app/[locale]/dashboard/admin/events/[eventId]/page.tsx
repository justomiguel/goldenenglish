import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { AdminEventDetailTabs, parseEventAdminTab } from "@/components/dashboard/admin/events/AdminEventDetailTabs";
import { AdminEventDetailTabContent } from "@/components/dashboard/admin/events/AdminEventDetailTabContent";
import { loadAdminEventDetailPageModel } from "@/lib/dashboard/events/loadAdminEventDetailPageModel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; eventId: string }>;
  searchParams: Promise<{
    tab?: string;
    attendeesPage?: string;
    attendeesQ?: string;
    paymentsPage?: string;
    paymentsQ?: string;
    page?: string;
    q?: string;
    paymentStatus?: string;
  }>;
}

export default async function AdminEventDetailPage({ params, searchParams }: PageProps) {
  await assertAdmin();
  const { locale, eventId } = await params;
  const sp = await searchParams;
  const tab = parseEventAdminTab(sp.tab);
  const dict = await getDictionary(locale);
  const detail = dict.admin.events.detail;
  const model = await loadAdminEventDetailPageModel({
    locale,
    eventId,
    tab,
    attendeesPage: sp.attendeesPage,
    attendeesQ: sp.attendeesQ,
    paymentsPage: sp.paymentsPage,
    paymentsQ: sp.paymentsQ,
    page: sp.page,
    q: sp.q,
    paymentStatus: sp.paymentStatus,
  });
  const baseHref = `/${locale}/dashboard/admin/events/${eventId}`;
  const pendingPayments = model.eventPayments.statusCounts.pending;

  return (
    <div className="space-y-4">
      <Link
        href={`/${locale}/dashboard/admin/events`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {detail.backToList}
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {detail.titlePrefix} {model.event.title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {detail.eventDate}: {new Date(String(model.event.event_date)).toLocaleString(locale)} ·{" "}
          {detail.status}: <span className="capitalize">{String(model.event.status)}</span> ·{" "}
          {detail.viewCount}: {Number(model.event.view_count ?? 0).toLocaleString(locale)}
        </p>
      </header>

      <AdminEventDetailTabs
        current={tab}
        baseHref={baseHref}
        counts={{
          attendees: model.attendees.totalCount,
          payments: pendingPayments > 0 ? pendingPayments : undefined,
        }}
        labels={{
          tabsAria: detail.tabsAria,
          tabs: detail.tabs,
          tabLeads: detail.tabLeads,
        }}
      >
        <AdminEventDetailTabContent
          tab={tab}
          locale={locale}
          eventId={eventId}
          model={model}
          dict={dict}
        />
      </AdminEventDetailTabs>
    </div>
  );
}
