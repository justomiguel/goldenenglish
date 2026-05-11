"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ScrollText } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";

export const STUDENT_PAYMENTS_TAB_OVERVIEW = "overview";
export const STUDENT_PAYMENTS_TAB_HISTORY = "history";

export interface StudentPaymentsScreenTabsProps {
  ariaLabel: string;
  overviewTabLabel: string;
  historyTabLabel: string;
  overview: ReactNode;
  history: ReactNode;
}

/**
 * Top-level student/tutor payments split: monthly overview vs receipt history.
 */
export function StudentPaymentsScreenTabs({
  ariaLabel,
  overviewTabLabel,
  historyTabLabel,
  overview,
  history,
}: StudentPaymentsScreenTabsProps) {
  const reactId = useId().replace(/:/g, "");
  const idPrefix = `pay-screen-${reactId}`;
  const [tab, setTab] = useState<string>(STUDENT_PAYMENTS_TAB_OVERVIEW);

  const items: UnderlineTabItem[] = useMemo(
    () => [
      { id: STUDENT_PAYMENTS_TAB_OVERVIEW, label: overviewTabLabel, Icon: CalendarDays },
      { id: STUDENT_PAYMENTS_TAB_HISTORY, label: historyTabLabel, Icon: ScrollText },
    ],
    [historyTabLabel, overviewTabLabel],
  );

  return (
    <div className="mt-6 min-w-0">
      <UnderlineTabBar idPrefix={idPrefix} ariaLabel={ariaLabel} items={items} value={tab} onChange={setTab} />
      <div
        id={underlinePanelId(idPrefix, STUDENT_PAYMENTS_TAB_OVERVIEW)}
        role="tabpanel"
        aria-labelledby={underlineTabId(idPrefix, STUDENT_PAYMENTS_TAB_OVERVIEW)}
        hidden={tab !== STUDENT_PAYMENTS_TAB_OVERVIEW}
        className="min-w-0 pt-4"
      >
        {overview}
      </div>
      <div
        id={underlinePanelId(idPrefix, STUDENT_PAYMENTS_TAB_HISTORY)}
        role="tabpanel"
        aria-labelledby={underlineTabId(idPrefix, STUDENT_PAYMENTS_TAB_HISTORY)}
        hidden={tab !== STUDENT_PAYMENTS_TAB_HISTORY}
        className="min-w-0 pt-4"
      >
        {history}
      </div>
    </div>
  );
}
