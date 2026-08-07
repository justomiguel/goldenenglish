import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMailboxCounts } from "@/lib/messaging/adminPortalMessageSource";

interface AdminMessagesFolderCountsProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  folder: "inbox" | "sent";
  counts: AdminPortalMailboxCounts;
}

type Tile = { key: string; value: number; label: string };

export function AdminMessagesFolderCounts({
  locale,
  labels,
  folder,
  counts,
}: AdminMessagesFolderCountsProps) {
  const format = (n: number) => new Intl.NumberFormat(locale).format(n);

  const tiles: Tile[] =
    folder === "sent"
      ? [{ key: "sent", value: counts.total, label: labels.countsSentLabel }]
      : [
          { key: "received", value: counts.total, label: labels.countsReceivedLabel },
          { key: "unread", value: counts.unread, label: labels.countsUnreadLabel },
          { key: "needs", value: counts.needsReply, label: labels.countsNeedsReplyLabel },
        ];

  return (
    <ul
      className={
        folder === "sent"
          ? "mt-4 flex list-none flex-wrap gap-3"
          : "mt-4 grid list-none grid-cols-1 gap-3 sm:grid-cols-3"
      }
      aria-label={labels.countsSummaryAria}
    >
      {tiles.map((tile) => (
        <li
          key={tile.key}
          className="min-w-[8.5rem] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        >
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-[var(--color-foreground)]">
            {format(tile.value)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{tile.label}</p>
        </li>
      ))}
    </ul>
  );
}
