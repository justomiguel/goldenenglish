"use client";

import { useId, useMemo } from "react";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { Receipt, Wallet } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { Dictionary } from "@/types/i18n";
import type { ReactNode } from "react";

export const PARENT_FINANCE_TAB_PAY = "pay";
export const PARENT_FINANCE_TAB_FEES = "fees";

interface ParentFinanceTabsProps {
  labels: Dictionary["dashboard"]["parent"];
  payPanel: ReactNode;
  feesPanel: ReactNode;
}

export function ParentFinanceTabs({ labels, payPanel, feesPanel }: ParentFinanceTabsProps) {
  const reactId = useId().replace(/:/g, "");
  const idPrefix = `parent-finance-${reactId}`;
  const { value: tab, setValue: setTab } = usePersistentPageTab({
    allowed: [PARENT_FINANCE_TAB_PAY, PARENT_FINANCE_TAB_FEES] as const,
    fallback: PARENT_FINANCE_TAB_PAY,
  });

  const items: UnderlineTabItem[] = useMemo(
    () => [
      { id: PARENT_FINANCE_TAB_PAY, label: labels.financeTabPay, Icon: Wallet },
      { id: PARENT_FINANCE_TAB_FEES, label: labels.financeTabFees, Icon: Receipt },
    ],
    [labels.financeTabFees, labels.financeTabPay],
  );

  return (
    <div className="mt-6 min-w-0">
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={labels.financeTabsAria}
        items={items}
        value={tab}
        onChange={(id) => {
          if (id === PARENT_FINANCE_TAB_PAY || id === PARENT_FINANCE_TAB_FEES) setTab(id);
        }}
      />
      <div
        id={underlinePanelId(idPrefix, PARENT_FINANCE_TAB_PAY)}
        role="tabpanel"
        aria-labelledby={underlineTabId(idPrefix, PARENT_FINANCE_TAB_PAY)}
        hidden={tab !== PARENT_FINANCE_TAB_PAY}
        className="min-w-0 pt-4"
      >
        {payPanel}
      </div>
      <div
        id={underlinePanelId(idPrefix, PARENT_FINANCE_TAB_FEES)}
        role="tabpanel"
        aria-labelledby={underlineTabId(idPrefix, PARENT_FINANCE_TAB_FEES)}
        hidden={tab !== PARENT_FINANCE_TAB_FEES}
        className="min-w-0 pt-4"
      >
        {feesPanel}
      </div>
    </div>
  );
}
