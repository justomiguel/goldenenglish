import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { AdminEventDetailTabs, parseEventAdminTab } from "@/components/dashboard/admin/events/AdminEventDetailTabs";
import { AdminEventDetailTabContent } from "@/components/dashboard/admin/events/AdminEventDetailTabContent";
import { loadAdminEventDetailPageModel } from "@/lib/dashboard/events/loadAdminEventDetailPageModel";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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
      <AdminBackLink href={`/${locale}/dashboard/admin/events`}>
        {detail.backToList}
      </AdminBackLink>
      <AdminPageHeader
        title={`${detail.titlePrefix} ${model.event.title}`}
        lead={`${detail.eventDate}: ${new Date(String(model.event.event_date)).toLocaleString(locale)} · ${detail.status}: ${String(model.event.status)} · ${detail.viewCount}: ${Number(model.event.view_count ?? 0).toLocaleString(locale)}`}
        iconId="events"
        tourAnchor={ADMIN_TOUR_ANCHORS.eventDetailTitle}
      />

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
