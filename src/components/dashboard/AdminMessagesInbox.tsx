import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";
import { Inbox } from "lucide-react";
import { AdminMessageCard } from "@/components/dashboard/AdminMessageCard";

interface AdminMessagesInboxProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  rows: AdminPortalMessageRow[];
  /** Default adds top margin for standalone pages; tabs pass false. */
  listTopMargin?: boolean;
  /** Overrides empty-state copy (e.g. when filters yield no rows). */
  emptyListLabel?: string;
}

export function AdminMessagesInbox({
  locale,
  labels,
  rows,
  listTopMargin = true,
  emptyListLabel,
}: AdminMessagesInboxProps) {
  const emptyMt = listTopMargin ? "mt-10" : "mt-4";
  const emptyCopy = emptyListLabel ?? labels.empty;

  if (rows.length === 0) {
    return (
      <div
        className={`${emptyMt} rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/20 px-6 py-12 text-center`}
      >
        <Inbox className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] opacity-60" aria-hidden />
        <p className="mt-4 text-sm font-medium text-[var(--color-foreground)]">{emptyCopy}</p>
      </div>
    );
  }

  const listMt = listTopMargin ? "mt-8" : "mt-3";

  return (
    <ul className={`${listMt} grid list-none gap-4 md:grid-cols-1 lg:gap-5`}>
      {rows.map((row) => (
        <li key={row.id}>
          <AdminMessageCard
            locale={locale}
            row={row}
            labels={labels}
            detailHref={`/${locale}/dashboard/admin/messages/${row.id}`}
          />
        </li>
      ))}
    </ul>
  );
}
