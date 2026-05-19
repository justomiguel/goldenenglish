"use client";

import { useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === PARENT_FINANCE_TAB_FEES ? PARENT_FINANCE_TAB_FEES : PARENT_FINANCE_TAB_PAY;
  const reactId = useId().replace(/:/g, "");
  const idPrefix = `parent-finance-${reactId}`;
  const [tab, setTab] = useState(initialTab);

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
        onChange={setTab}
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
