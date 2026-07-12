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
import { AdminMessagesFolderCounts } from "@/components/dashboard/AdminMessagesFolderCounts";
import { AdminMessagesBulkBar } from "@/components/dashboard/AdminMessagesBulkBar";
import { useAdminMessagesBulkSelection } from "@/hooks/useAdminMessagesBulkSelection";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { summarizeAdminPortalMailboxCounts } from "@/lib/messaging/adminPortalMessageSource";
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
  const activeRows = tab === "inbox" ? inboxRows : sentRows;
  const counts = summarizeAdminPortalMailboxCounts(activeRows);
  const visibleIds = useMemo(() => activeRows.map((r) => r.id), [activeRows]);

  const bulk = useAdminMessagesBulkSelection({
    locale,
    folderKey: tab,
    visibleIds,
  });

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
          showReadToggle={t === "inbox"}
          selectedIds={bulk.selected}
          onToggleSelected={bulk.toggle}
          selectionDisabled={bulk.busy}
        />
      ) : null}
    </div>
  );

  return (
    <section className="mt-8 min-w-0 overflow-x-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
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
        className="bg-[var(--color-background)] px-3 py-4 md:px-5 md:py-5"
      >
        <p className="text-sm leading-snug text-[var(--color-muted-foreground)]" aria-live="polite">
          {hint}
        </p>
        <AdminMessagesFolderCounts
          locale={locale}
          labels={labels}
          folder={tab}
          counts={counts}
        />
        <AdminMessagesBulkBar
          labels={labels}
          selectedCount={bulk.selectedCount}
          allVisibleSelected={bulk.allVisibleSelected}
          visibleCount={activeRows.length}
          busy={bulk.busy}
          errorCode={bulk.errorCode}
          showReadActions={tab === "inbox"}
          onSelectAll={bulk.selectAllVisible}
          onClear={bulk.clear}
          onMarkRead={bulk.markRead}
          onMarkUnread={bulk.markUnread}
          onDelete={bulk.deleteSelected}
        />
        <div className="mt-5">
          {panel("inbox")}
          {panel("sent")}
        </div>
      </div>
    </section>
  );
}
