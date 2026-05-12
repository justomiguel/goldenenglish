"use client";

import { useId, useMemo, useState } from "react";
import { Inbox, SendHorizontal } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { AdminMessagesInbox } from "@/components/dashboard/AdminMessagesInbox";
import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";

type TabId = "inbox" | "sent";

interface AdminMessagesTabsProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  inboxRows: AdminPortalMessageRow[];
  sentRows: AdminPortalMessageRow[];
  emptyListLabel?: string;
}

export function AdminMessagesTabs({
  locale,
  labels,
  inboxRows,
  sentRows,
  emptyListLabel,
}: AdminMessagesTabsProps) {
  const reactId = useId().replace(/:/g, "");
  const idPrefix = `admin-msg-${reactId}`;
  const [tab, setTab] = useState<TabId>("inbox");

  const items: UnderlineTabItem[] = useMemo(
    () => [
      {
        id: "inbox",
        label: labels.tabsInbox,
        Icon: Inbox,
      },
      {
        id: "sent",
        label: labels.tabsSent,
        Icon: SendHorizontal,
      },
    ],
    [labels],
  );

  const hint = tab === "inbox" ? labels.tabInboxDescription : labels.tabSentDescription;

  const rowsFor = (t: TabId) => (t === "inbox" ? inboxRows : sentRows);

  const panel = (t: TabId) => (
    <div
      role="tabpanel"
      id={underlinePanelId(idPrefix, t)}
      aria-labelledby={underlineTabId(idPrefix, t)}
      hidden={tab !== t}
      className="min-w-0"
    >
      {tab === t ? (
        <AdminMessagesInbox
          locale={locale}
          labels={labels}
          rows={rowsFor(t)}
          listTopMargin={false}
          emptyListLabel={emptyListLabel}
        />
      ) : null}
    </div>
  );

  return (
    <section className="mt-8 min-w-0 overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      {/* Tab strip */}
      <div className="bg-[var(--color-muted)]/30 px-2 pt-2 md:px-4 md:pt-3">
        <UnderlineTabBar
          idPrefix={idPrefix}
          ariaLabel={labels.tablistAria}
          items={items}
          value={tab}
          onChange={(id) => setTab(id as TabId)}
        />
      </div>

      {/* Active folder content */}
      <div className="bg-[var(--color-background)] px-3 py-4 md:px-5 md:py-5">
        <p className="text-sm leading-snug text-[var(--color-muted-foreground)]" aria-live="polite">
          {hint}
        </p>
        <div className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/12 p-3 md:p-4">
          {panel("inbox")}
          {panel("sent")}
        </div>
      </div>
    </section>
  );
}
