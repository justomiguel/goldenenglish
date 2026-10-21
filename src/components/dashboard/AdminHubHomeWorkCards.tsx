import { ClipboardCheck, ClipboardList, CreditCard, Wallet } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { AdminHubMessagesCard } from "@/components/dashboard/AdminHubMessagesCard";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";

export function AdminHubHomePaymentsCard({
  base,
  dict,
  summary,
}: {
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
}) {
  const t = dict.admin.home.summary.payments;
  const pending = summary.payments.pendingCount > 0;
  return (
    <AdminHubMetricCard
      href={`${base}/payments`}
      tourAnchor="admin-hub-payments"
      icon={<Wallet className="h-6 w-6" />}
      title={t.title}
      hint={t.cardTip}
      accentClass={pending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}
      linkLabel={t.viewAll}
      urgent={pending}
      illustration={
        <CreditCard
          className={`h-14 w-14 ${pending ? "text-amber-300" : "text-emerald-300"}`}
          strokeWidth={1.15}
        />
      }
    >
      {pending ? (
        <>
          <p className="text-4xl font-bold text-amber-600">{summary.payments.pendingCount}</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.pending}</p>
        </>
      ) : (
        <p className="text-sm font-medium text-emerald-600">{t.noPending}</p>
      )}
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeRegistrationsCard({
  base,
  dict,
  summary,
}: {
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
}) {
  const t = dict.admin.home.summary.registrations;
  const fresh = summary.registrations.newCount > 0;
  return (
    <AdminHubMetricCard
      href={`${base}/registrations`}
      tourAnchor="admin-hub-registrations"
      icon={<ClipboardList className="h-6 w-6" />}
      title={t.title}
      hint={t.cardTip}
      accentClass={fresh ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}
      linkLabel={t.viewAll}
      urgent={fresh}
      illustration={
        <ClipboardCheck
          className={`h-14 w-14 ${fresh ? "text-orange-300" : "text-emerald-300"}`}
          strokeWidth={1.15}
        />
      }
    >
      {fresh ? (
        <>
          <p className="text-4xl font-bold text-orange-600">{summary.registrations.newCount}</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.newCount}</p>
        </>
      ) : (
        <>
          <p className="text-4xl font-bold text-[var(--color-foreground)]">0</p>
          <p className="mt-1 text-sm font-medium text-emerald-600">{t.noNew}</p>
        </>
      )}
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        {t.awaitingFee}: {summary.registrations.awaitingFeeCount}
      </p>
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeMessagesSlot({
  locale,
  base,
  dict,
  summary,
}: {
  locale: string;
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
}) {
  const t = dict.admin.home.summary.messages;
  return (
    <AdminHubMessagesCard
      href={`${base}/messages`}
      tourAnchor="admin-hub-messages"
      labels={t}
      cardTip={t.cardTip}
      recentCount={summary.messages.recentCount}
      latestPreview={summary.messages.latestPreview}
      locale={locale}
    />
  );
}
