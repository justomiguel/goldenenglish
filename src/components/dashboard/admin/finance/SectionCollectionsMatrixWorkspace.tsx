"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendOverdueBalanceRemindersAction } from "@/app/[locale]/dashboard/admin/finance/collections/overdueBalanceRemindersAction";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary, Locale } from "@/types/i18n";
import { AdminBillingMatrixLegendModal } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import { useSectionCollectionsCellSelection } from "@/hooks/useSectionCollectionsCellSelection";
import { runSectionCellBulkAction } from "@/lib/billing/runSectionCellBulkAction";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import { SectionCollectionsKpisCard } from "./SectionCollectionsKpisCard";
import { SectionCollectionsMatrixTable } from "./SectionCollectionsMatrixTable";
import { SectionCollectionsExportButtons } from "./SectionCollectionsExportButtons";
import { SectionCollectionsBulkMessageModal } from "./SectionCollectionsBulkMessageModal";
import { financeCollectionsMatrixLegendLabels } from "./collectionsMatrixLegendLabels";
import { SectionCollectionsCellActionBar, type SectionCellBulkAction } from "./SectionCollectionsCellActionBar";
import { SectionCollectionsCellActionModal } from "./SectionCollectionsCellActionModal";
import { SectionCollectionsStudentActionBar } from "./SectionCollectionsStudentActionBar";
import { SectionCollectionsBulkScholarshipTrigger } from "./SectionCollectionsBulkScholarshipTrigger";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsMatrixWorkspaceProps {
  view: SectionCollectionsView;
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
  locale: string;
  currency?: string;
  onBulkScholarshipNotice?: (msg: string | null) => void;
}

export function SectionCollectionsMatrixWorkspace({
  view,
  dict,
  billingLabels,
  locale,
  currency,
  onBulkScholarshipNotice,
}: SectionCollectionsMatrixWorkspaceProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [overdueBusy, setOverdueBusy] = useState(false);
  const [overdueNotice, setOverdueNotice] = useState<string | null>(null);
  const [cellActionBusy, setCellActionBusy] = useState(false);
  const [cellActionModalAction, setCellActionModalAction] = useState<SectionCellBulkAction | null>(null);
  const [cellActionNotice, setCellActionNotice] = useState<string | null>(null);

  const cellSelection = useSectionCollectionsCellSelection();

  const selectionIncludesEnrollmentFee = useMemo(() => {
    for (const months of cellSelection.cellsGroupedByStudent.values()) {
      if (months.includes(SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH)) return true;
    }
    return false;
  }, [cellSelection.cellsGroupedByStudent]);

  const overdueIds = useMemo(
    () => view.students.filter((s) => s.hasOverdue).map((s) => s.studentId),
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
    setSelectedIds(next ? new Set(view.students.map((s) => s.studentId)) : new Set());
  }

  function selectOverdue() {
    cellSelection.selectAllOverdue(
      view.students,
      view.year,
      view.todayMonth,
      view.sectionStartsOn,
    );
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

  const setScholarNotice = onBulkScholarshipNotice ?? (() => {});

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
            <SectionCollectionsBulkScholarshipTrigger
              locale={locale}
              sectionId={view.sectionId}
              year={view.year}
              studentCount={view.students.length}
              selectedStudentIds={recipientIds}
              dict={dict}
              onNotice={setScholarNotice}
            />
            <button
              type="button"
              onClick={selectOverdue}
              disabled={overdueIds.length === 0}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {dict.matrix.selectOverdue}
            </button>
            {selectionCount > 0 ? (
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

      {cellSelection.selectionCount > 0 ? (
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
        cellSelectable
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
        includesEnrollmentFee={selectionIncludesEnrollmentFee}
        onClose={() => setCellActionModalAction(null)}
        onConfirm={handleCellActionConfirm}
        busy={cellActionBusy}
        dict={dict}
      />
    </div>
  );
}
