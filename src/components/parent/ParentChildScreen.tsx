"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import type { ParentChildMetric } from "@/lib/parent/buildParentChildMetrics";
import {
  ParentChildSectionCard,
  type ParentChildPreviewItem,
} from "@/components/parent/ParentChildSectionCard";
import { ParentChildMetricStrip } from "@/components/parent/ParentChildMetricStrip";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

type ChildCopy = Dictionary["dashboard"]["parent"]["childScreen"];

export interface ParentChildSectionModel {
  id: string;
  title: string;
  href: string;
  emptyLabel: string;
  items: ParentChildPreviewItem[];
  failed: boolean;
}

export interface ParentChildScreenProps {
  title: string;
  subtitle: string;
  copy: ChildCopy;
  metrics: ParentChildMetric[];
  metricHrefs: { attendance: string; average: string; pendingTasks: string };
  sections: ParentChildSectionModel[];
  failedLabel: string;
}

export function ParentChildScreen({
  title,
  subtitle,
  copy,
  metrics,
  metricHrefs,
  sections,
  failedLabel,
}: ParentChildScreenProps) {
  const header = (
    <header className="space-y-1" data-tour={PARENT_TOUR_ANCHORS.childTitle}>
      <h1 className="font-display text-xl font-bold text-[var(--color-foreground)] md:text-2xl">
        {title}
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
    </header>
  );

  const metricStrip = (
    <ParentChildMetricStrip metrics={metrics} copy={copy} hrefById={metricHrefs} />
  );

  const cards = sections.map((section) => (
    <ParentChildSectionCard
      key={section.id}
      title={section.title}
      href={section.href}
      seeAllLabel={copy.seeAll}
      emptyLabel={section.emptyLabel}
      items={section.items}
      failed={section.failed}
      failedLabel={failedLabel}
    />
  ));

  const body = (children: ReactNode) => (
    <div data-tour={PARENT_TOUR_ANCHORS.childBody}>{children}</div>
  );

  // Desktop keeps the identity and the three numbers pinned on the left while the
  // sections spread across two columns.
  const desktop = (
    <div className="grid grid-cols-[20rem_minmax(0,1fr)] items-start gap-6">
      <div className="space-y-4">
        {header}
        {metricStrip}
      </div>
      {body(<div className="grid grid-cols-2 gap-3">{cards}</div>)}
    </div>
  );

  const narrow = (
    <div className="space-y-4">
      {header}
      {metricStrip}
      {body(<div className="space-y-3">{cards}</div>)}
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={
        <div className="space-y-4">
          {header}
          <div className="h-40 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
        </div>
      }
      desktop={desktop}
      narrow={() => narrow}
    />
  );
}
