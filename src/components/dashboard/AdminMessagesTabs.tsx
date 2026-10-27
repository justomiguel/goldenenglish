"use client";

import { useId, useMemo } from "react";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { Inbox, SendHorizontal } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { AdminMessagesInbox } from "@/components/dashboard/AdminMessagesInbox";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";

type TabId = "inbox" | "sent";

const MESSAGE_TABS: readonly TabId[] = ["inbox", "sent"];

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
  const { value: tab, setValue: setTab } = usePersistentPageTab<TabId>({
    allowed: MESSAGE_TABS,
    fallback: "inbox",
  });

  const items: UnderlineTabItem[] = useMemo(
    () => [
      {
        id: "inbox",
        label: labels.tabsInbox,
        Icon: Inbox,
        tourId: ADMIN_TOUR_ANCHORS.messagesTabInbox,
      },
      {
        id: "sent",
        label: labels.tabsSent,
        Icon: SendHorizontal,
        tourId: ADMIN_TOUR_ANCHORS.messagesTabSent,
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
    <section className="mt-3 min-w-0 overflow-x-hidden md:mt-6 md:rounded-2xl md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:shadow-[var(--shadow-soft)]">
      <div
        data-tour={ADMIN_TOUR_ANCHORS.messagesTabs}
        className="bg-[var(--color-muted)]/30 px-2 pt-2 md:px-4 md:pt-3"
      >
        <UnderlineTabBar
          idPrefix={idPrefix}
          ariaLabel={labels.tablistAria}
          items={items}
          value={tab}
          onChange={(id) => setTab(id as TabId)}
        />
      </div>

      <div
        data-tour={ADMIN_TOUR_ANCHORS.messagesList}
        className="bg-[var(--color-background)] px-0 py-2 md:px-5 md:py-5"
      >
        <p className="hidden text-sm leading-snug text-[var(--color-muted-foreground)] md:block" aria-live="polite">
          {hint}
        </p>
        <div className="mt-2 md:mt-5">
          {panel("inbox")}
          {panel("sent")}
        </div>
      </div>
    </section>
  );
}
