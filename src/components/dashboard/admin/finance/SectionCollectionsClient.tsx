"use client";

import { GraduationCap, History, Receipt, Table2 } from "lucide-react";
import { useId, useState } from "react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { SectionCollectionsScholarshipListRow } from "@/types/sectionCollectionsTabs";
import type { Dictionary } from "@/types/i18n";
import { SectionCollectionsMatrixWorkspace } from "./SectionCollectionsMatrixWorkspace";
import { SectionCollectionsHistoryTab } from "./SectionCollectionsHistoryTab";
import { SectionCollectionsScholarshipsTab } from "./SectionCollectionsScholarshipsTab";
import { SectionCollectionsEnrollmentTab } from "./SectionCollectionsEnrollmentTab";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];
type TabId = "matrix" | "history" | "scholarships" | "enrollment";

export interface SectionCollectionsClientProps {
  view: SectionCollectionsView;
  sectionScholarships: SectionCollectionsScholarshipListRow[];
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
  locale: string;
  currency?: string;
}

export function SectionCollectionsClient({
  view,
  sectionScholarships,
  dict,
  billingLabels,
  locale,
  currency,
}: SectionCollectionsClientProps) {
  const [tab, setTab] = useState<TabId>("matrix");
  const idPrefix = useId().replace(/:/g, "");
  const t = dict.sectionTabs;

  const items: readonly UnderlineTabItem[] = [
    { id: "matrix", label: t.matrix, Icon: Table2 },
    { id: "history", label: t.history, Icon: History },
    { id: "scholarships", label: t.scholarships, Icon: GraduationCap },
    { id: "enrollment", label: t.enrollment, Icon: Receipt },
  ];

  return (
    <div className="flex flex-col gap-4">
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={t.aria}
        items={items}
        value={tab}
        layout="gridTwoRow"
        onChange={(id) => setTab(id as TabId)}
      />

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "matrix")}
        aria-labelledby={underlineTabId(idPrefix, "matrix")}
        hidden={tab !== "matrix"}
        className="min-h-0"
      >
        {tab === "matrix" ? (
          <SectionCollectionsMatrixWorkspace
            view={view}
            dict={dict}
            billingLabels={billingLabels}
            locale={locale}
            currency={currency}
          />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "history")}
        aria-labelledby={underlineTabId(idPrefix, "history")}
        hidden={tab !== "history"}
        className="min-h-0 pt-2"
      >
        {tab === "history" ? (
          <SectionCollectionsHistoryTab
            locale={locale}
            sectionId={view.sectionId}
            dict={dict}
            billingLabels={billingLabels}
          />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "scholarships")}
        aria-labelledby={underlineTabId(idPrefix, "scholarships")}
        hidden={tab !== "scholarships"}
        className="min-h-0 pt-2"
      >
        {tab === "scholarships" ? (
          <SectionCollectionsScholarshipsTab
            locale={locale}
            view={view}
            scholarships={sectionScholarships}
            dict={dict}
            billingLabels={billingLabels}
          />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "enrollment")}
        aria-labelledby={underlineTabId(idPrefix, "enrollment")}
        hidden={tab !== "enrollment"}
        className="min-h-0 pt-2"
      >
        {tab === "enrollment" ? (
          <SectionCollectionsEnrollmentTab
            locale={locale}
            view={view}
            dict={dict}
            billingLabels={billingLabels}
          />
        ) : null}
      </div>
    </div>
  );
}
