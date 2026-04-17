"use client";

import { useState } from "react";
import { AdminMessagesInbox, type AdminMessageRow } from "@/components/dashboard/AdminMessagesInbox";
import type { Dictionary } from "@/types/i18n";

type Tab = "inbox" | "sent" | "all";

interface AdminMessagesTabsProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  inboxRows: AdminMessageRow[];
  sentRows: AdminMessageRow[];
  allRows: AdminMessageRow[];
}

export function AdminMessagesTabs({
  locale,
  labels,
  inboxRows,
  sentRows,
  allRows,
}: AdminMessagesTabsProps) {
  const [tab, setTab] = useState<Tab>("inbox");
  const rows = tab === "inbox" ? inboxRows : tab === "sent" ? sentRows : allRows;

  const tabTips: Record<Tab, string> = {
    inbox: labels.tabInboxTooltip,
    sent: labels.tabSentTooltip,
    all: labels.tabAllTooltip,
  };

  const btn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      title={tabTips[t]}
      className={`min-h-[44px] rounded-[var(--layout-border-radius)] px-4 py-2 text-sm font-medium transition ${
        tab === t
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={labels.tablistAria}>
        {btn("inbox", labels.tabsInbox)}
        {btn("sent", labels.tabsSent)}
        {btn("all", labels.tabsAll)}
      </div>
      <AdminMessagesInbox locale={locale} labels={labels} rows={rows} />
    </div>
  );
}
