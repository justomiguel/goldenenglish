"use client";

import { Mail, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { SectionCollectionsKpisCard } from "./SectionCollectionsKpisCard";
import { SectionCollectionsMatrixTable } from "./SectionCollectionsMatrixTable";
import { SectionCollectionsExportButtons } from "./SectionCollectionsExportButtons";
import { SectionCollectionsBulkMessageModal } from "./SectionCollectionsBulkMessageModal";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsClientProps {
  view: SectionCollectionsView;
  dict: CollectionsDict;
  locale: string;
  currency?: string;
}

export function SectionCollectionsClient({
  view,
  dict,
  locale,
  currency,
}: SectionCollectionsClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const overdueIds = useMemo(
    () =>
      view.students.filter((s) => s.hasOverdue).map((s) => s.studentId),
    [view.students],
  );

  function toggleStudent(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }
  function toggleAll(next: boolean) {
    setSelectedIds(
      next ? new Set(view.students.map((s) => s.studentId)) : new Set(),
    );
  }
  function selectOverdue() {
    setSelectedIds(new Set(overdueIds));
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectionCount = selectedIds.size;
  const recipientIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return (
    <div className="flex flex-col gap-4">
      <SectionCollectionsKpisCard
        kpis={view.kpis}
        dict={dict}
        locale={locale}
        currency={currency}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectOverdue}
            disabled={overdueIds.length === 0}
            className="inline-flex items-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dict.matrix.selectOverdue}
          </button>
          {selectionCount > 0 ? (
            <>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {dict.matrix.selectionCount.replace(
                  "{count}",
                  String(selectionCount),
                )}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                aria-label={dict.matrix.clearSelection}
                title={dict.matrix.clearSelection}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:bg-[var(--color-primary)]/90"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span>{dict.bulk.messageTitle}</span>
              </button>
            </>
          ) : null}
        </div>
        <SectionCollectionsExportButtons
          locale={locale}
          sectionId={view.sectionId}
          year={view.year}
          dict={dict}
        />
      </div>
      <SectionCollectionsMatrixTable
        view={view}
        dict={dict}
        locale={locale}
        currency={currency}
        selectedIds={selectedIds}
        onToggleStudent={toggleStudent}
        onToggleAll={toggleAll}
      />
      <SectionCollectionsBulkMessageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        locale={locale}
        sectionId={view.sectionId}
        recipientIds={recipientIds}
        dict={dict}
        onSent={() => clearSelection()}
      />
    </div>
  );
}
