"use client";

import type { PortalAccountItem } from "@/lib/portal/portalShellTypes";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";
import { PortalAccountList } from "@/components/portal/PortalAccountList";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export interface ParentAccountScreenProps {
  locale: string;
  title: string;
  lead: string;
  items: PortalAccountItem[];
  localeLabels: LanguageSwitcherLabels;
}

export function ParentAccountScreen({
  locale,
  title,
  lead,
  items,
  localeLabels,
}: ParentAccountScreenProps) {
  const header = (
    <header className="space-y-1" data-tour={PARENT_TOUR_ANCHORS.accountTitle}>
      <h1 className="font-display text-xl font-bold text-[var(--color-foreground)] md:text-2xl">
        {title}
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>
    </header>
  );

  const list = (
    <div
      data-tour={PARENT_TOUR_ANCHORS.accountBody}
      className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <PortalAccountList locale={locale} items={items} localeLabels={localeLabels} />
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<div className="space-y-5">{header}</div>}
      desktop={
        <div className="max-w-xl space-y-6">
          {header}
          {list}
        </div>
      }
      narrow={() => (
        <div className="space-y-4">
          {header}
          {list}
        </div>
      )}
    />
  );
}
