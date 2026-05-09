"use client";

import { MousePointerClick } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendOverdueBalanceRemindersAction } from "@/app/[locale]/dashboard/admin/finance/collections/overdueBalanceRemindersAction";
import { Button } from "@/components/atoms/Button";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary, Locale } from "@/types/i18n";
import { AdminBillingMatrixLegendModal } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import { useSectionCollectionsCellSelection } from "@/hooks/useSectionCollectionsCellSelection";
import { runSectionCellBulkAction } from "@/lib/billing/runSectionCellBulkAction";
import { SectionCollectionsKpisCard } from "./SectionCollectionsKpisCard";
import { SectionCollectionsMatrixTable } from "./SectionCollectionsMatrixTable";
import { SectionCollectionsExportButtons } from "./SectionCollectionsExportButtons";
import { SectionCollectionsBulkMessageModal } from "./SectionCollectionsBulkMessageModal";
import { financeCollectionsMatrixLegendLabels } from "./collectionsMatrixLegendLabels";
import { SectionCollectionsCellActionBar, type SectionCellBulkAction } from "./SectionCollectionsCellActionBar";
import { SectionCollectionsCellActionModal } from "./SectionCollectionsCellActionModal";
import { SectionCollectionsStudentActionBar } from "./SectionCollectionsStudentActionBar";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsClientProps {
  view: SectionCollectionsView;
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
  locale: string;
  currency?: string;
}

export function SectionCollectionsClient({
  view,
  dict,
  billingLabels,
  locale,
  currency,
}: SectionCollectionsClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [overdueBusy, setOverdueBusy] = useState(false);
  const [overdueNotice, setOverdueNotice] = useState<string | null>(null);
  const [cellEditMode, setCellEditMode] = useState(false);
  const [cellActionBusy, setCellActionBusy] = useState(false);
  const [cellActionModalAction, setCellActionModalAction] = useState<SectionCellBulkAction | null>(null);
  const [cellActionNotice, setCellActionNotice] = useState<string | null>(null);

  const cellSelection = useSectionCollectionsCellSelection();

  const overdueIds = useMemo(
    () => view.students.filter((s) => s.hasOverdue).map((s) => s.studentId),
    [view.students],
  );

  function toggleStudent(id: string, next: boolean) {
    const student = view.students.find((s) => s.studentId === id);
    const months = student?.row.cells.map((c) => c.month) ?? [];
    if (cellEditMode) cellSelection.toggleStudentRow(id, next, months);
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function toggleAll(next: boolean) {
    if (cellEditMode) cellSelection.toggleAllStudents(next, view.students);
    setSelectedIds(next ? new Set(view.students.map((s) => s.studentId)) : new Set());
  }

  function selectOverdue() {
    if (cellEditMode) cellSelection.selectAllOverdue(view.students, view.year, view.todayMonth);
    setSelectedIds(new Set(overdueIds));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    cellSelection.clearSelection();
  }

  const selectionCount = selectedIds.size;
  const recipientIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const selectedOverdueIds = useMemo(
    () => recipientIds.filter((id) => view.students.find((r) => r.studentId === id)?.hasOverdue),
    [recipientIds, view.students],
  );

  async function handleSendOverdueReminders() {
    if (selectedOverdueIds.length === 0) {
      setOverdueNotice(dict.matrix.overdueEmailNoneSelected);
      return;
    }
    setOverdueBusy(true);
    setOverdueNotice(null);
    const r = await sendOverdueBalanceRemindersAction({
      locale,
      sectionId: view.sectionId,
      year: view.year,
      recipientIds: selectedOverdueIds,
    });
    setOverdueBusy(false);
    setOverdueNotice(
      r.ok
        ? dict.matrix.overdueEmailDone.replace("{sent}", String(r.sent)).replace("{skipped}", String(r.skipped))
        : dict.matrix.overdueEmailFailed,
    );
  }

  const handleCellActionConfirm = useCallback(
    async (params: { action: SectionCellBulkAction; scholarshipPercent?: number; note?: string }) => {
      setCellActionBusy(true);
      setCellActionNotice(null);
      const result = await runSectionCellBulkAction({
        action: params.action,
        sectionId: view.sectionId,
        year: view.year,
        cellsByStudent: cellSelection.cellsGroupedByStudent,
        locale: locale as Locale,
        labels: billingLabels,
        scholarshipPercent: params.scholarshipPercent,
        note: params.note,
      });
      setCellActionBusy(false);
      setCellActionModalAction(null);
      if (result.ok) {
        setCellActionNotice(dict.cellActions.resultOk.replace("{count}", String(result.successCount)));
        cellSelection.clearSelection();
        router.refresh();
      } else {
        setCellActionNotice(
          dict.cellActions.resultPartial
            .replace("{ok}", String(result.successCount))
            .replace("{failed}", String(result.failedCount)),
        );
      }
    },
    [view.sectionId, view.year, cellSelection, locale, billingLabels, dict.cellActions, router],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionCollectionsKpisCard kpis={view.kpis} dict={dict} locale={locale} currency={currency} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
        <div className="flex flex-col gap-2">
          {overdueNotice || cellActionNotice ? (
            <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
              {overdueNotice ?? cellActionNotice}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={cellEditMode ? "primary" : "ghost"}
              onClick={() => setCellEditMode((v) => !v)}
              aria-pressed={cellEditMode}
            >
              <MousePointerClick className="h-4 w-4" aria-hidden />
              {cellEditMode ? dict.cellActions.markPaid : dict.cellActions.markPaid}
            </Button>
            <button
              type="button"
              onClick={selectOverdue}
              disabled={overdueIds.length === 0}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {dict.matrix.selectOverdue}
            </button>
            {!cellEditMode ? (
              <SectionCollectionsStudentActionBar
                selectionCount={selectionCount}
                onClear={clearSelection}
                onOpenMessageModal={() => setModalOpen(true)}
                onSendOverdueReminders={handleSendOverdueReminders}
                overdueBusy={overdueBusy}
                dict={dict}
              />
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AdminBillingMatrixLegendModal labels={financeCollectionsMatrixLegendLabels(dict)} />
          <SectionCollectionsExportButtons locale={locale} sectionId={view.sectionId} year={view.year} dict={dict} />
        </div>
      </div>

      {cellEditMode && cellSelection.selectionCount > 0 ? (
        <SectionCollectionsCellActionBar
          cellCount={cellSelection.selectionCount}
          studentCount={cellSelection.selectedStudents.size}
          onClear={cellSelection.clearSelection}
          onAction={setCellActionModalAction}
          busy={cellActionBusy}
          dict={dict}
        />
      ) : null}

      <SectionCollectionsMatrixTable
        view={view}
        dict={dict}
        locale={locale}
        currency={currency}
        selectedIds={selectedIds}
        onToggleStudent={toggleStudent}
        onToggleAll={toggleAll}
        cellSelectable={cellEditMode}
        isCellSelected={cellSelection.isCellSelected}
        onToggleCell={cellSelection.toggleCell}
      />

      <SectionCollectionsBulkMessageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        locale={locale}
        sectionId={view.sectionId}
        recipientIds={recipientIds}
        dict={dict}
        onSent={clearSelection}
      />

      <SectionCollectionsCellActionModal
        open={cellActionModalAction != null}
        action={cellActionModalAction}
        cellCount={cellSelection.selectionCount}
        onClose={() => setCellActionModalAction(null)}
        onConfirm={handleCellActionConfirm}
        busy={cellActionBusy}
        dict={dict}
      />
    </div>
  );
}
