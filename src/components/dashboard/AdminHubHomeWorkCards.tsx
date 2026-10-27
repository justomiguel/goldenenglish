import { ClipboardList, Wallet } from "lucide-react";
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
      icon={<Wallet className="h-4 w-4" />}
      title={t.title}
      hint={t.cardTip}
      accentClass={pending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}
      linkLabel={t.viewAll}
      urgent={pending}
      compact
    >
      {pending ? (
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600">{summary.payments.pendingCount}</span>
          <span className="truncate text-xs text-[var(--color-muted-foreground)]">{t.pending}</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-emerald-600">{t.noPending}</p>
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
      icon={<ClipboardList className="h-4 w-4" />}
      title={t.title}
      hint={t.cardTip}
      accentClass={fresh ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}
      linkLabel={t.viewAll}
      urgent={fresh}
      compact
    >
      {fresh ? (
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-orange-600">{summary.registrations.newCount}</span>
          <span className="truncate text-xs text-[var(--color-muted-foreground)]">{t.newCount}</span>
        </p>
      ) : (
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[var(--color-foreground)]">0</span>
          <span className="truncate text-xs font-medium text-emerald-600">{t.noNew}</span>
        </p>
      )}
      <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
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
