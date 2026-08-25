import { Inbox, Mail, MailWarning, SendHorizontal } from "lucide-react";
import { AdminStatCard } from "@/components/dashboard/AdminStatCard";
import { peopleSharePercent } from "@/lib/dashboard/loadAdminPeoplePageStats";
import type { AdminPortalMailboxCounts } from "@/lib/messaging/adminPortalMessageSource";
import type { Dictionary } from "@/types/i18n";

interface AdminMessagesFolderCountsProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  shareOfTotal: string;
  inbox: AdminPortalMailboxCounts;
  sentTotal: number;
}

export function AdminMessagesFolderCounts({
  locale,
  labels,
  shareOfTotal,
  inbox,
  sentTotal,
}: AdminMessagesFolderCountsProps) {
  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  const ic = "h-5 w-5";
  const mailboxTotal = inbox.total + sentTotal;
  const share = (part: number, total: number) =>
    shareOfTotal.replace(
      "{{pct}}",
      peopleSharePercent(part, total).toLocaleString(locale, { maximumFractionDigits: 1 }),
    );

  return (
    <ul
      className="relative z-0 mt-6 grid list-none gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label={labels.countsSummaryAria}
    >
      <li className="min-w-0">
        <AdminStatCard
          icon={<Inbox className={ic} strokeWidth={1.5} aria-hidden />}
          iconClass="bg-sky-100 text-sky-700"
          label={labels.countsReceivedLabel}
          value={fmt(inbox.total)}
          hint={share(inbox.total, mailboxTotal)}
        />
      </li>
      <li className="min-w-0">
        <AdminStatCard
          icon={<Mail className={ic} strokeWidth={1.5} aria-hidden />}
          iconClass="bg-amber-100 text-amber-700"
          label={labels.countsUnreadLabel}
          value={fmt(inbox.unread)}
          hint={share(inbox.unread, inbox.total)}
        />
      </li>
      <li className="min-w-0">
        <AdminStatCard
          icon={<MailWarning className={ic} strokeWidth={1.5} aria-hidden />}
          iconClass="bg-violet-100 text-violet-700"
          label={labels.countsNeedsReplyLabel}
          value={fmt(inbox.needsReply)}
          hint={share(inbox.needsReply, inbox.total)}
        />
      </li>
      <li className="min-w-0">
        <AdminStatCard
          icon={<SendHorizontal className={ic} strokeWidth={1.5} aria-hidden />}
          iconClass="bg-emerald-100 text-emerald-700"
          label={labels.countsSentLabel}
          value={fmt(sentTotal)}
          hint={share(sentTotal, mailboxTotal)}
        />
      </li>
    </ul>
  );
}
