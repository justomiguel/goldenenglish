"use client";

import { useState } from "react";
import { FileText, Home } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { DraftOp } from "@/lib/theme-document/editorDraftOps";
import { THEME_PAGE_IDS, type ThemeDocumentV1, type ThemePageId } from "@/lib/theme-document/themeDocumentV1";
import { PageSectionList } from "./PageSectionList";

export type PagesLabels = Dictionary["admin"]["designEditor"]["pages"];

const PAGE_IDS = THEME_PAGE_IDS;
type PageId = ThemePageId;

export function PagesTab({
  document,
  tenantSlug,
  isLocked,
  onApply,
  labels,
}: {
  document: ThemeDocumentV1;
  tenantSlug: string | null;
  isLocked: (path: string) => boolean;
  onApply: (op: DraftOp) => void;
  labels: PagesLabels;
}) {
  const [pageId, setPageId] = useState<PageId>("home");
  const sections = pageId === "home" ? document.sections : (document.pages[pageId as ThemePageId]?.sections ?? []);
  const orderPath = pageId === "home" ? "sections.order" : `pages.${pageId}.sections.order`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {PAGE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={pageId === id}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
            onClick={() => setPageId(id)}
          >
            {id === "home" ? <Home className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
            {labels[id]}
          </button>
        ))}
      </div>
      <PageSectionList
        sections={sections}
        scope={pageId}
        tenantSlug={tenantSlug}
        orderLocked={isLocked(orderPath)}
        labels={labels}
        onApply={onApply}
      />
    </div>
  );
}
