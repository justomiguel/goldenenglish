"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendOverdueBalanceRemindersAction } from "@/app/[locale]/dashboard/admin/finance/collections/overdueBalanceRemindersAction";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary, Locale } from "@/types/i18n";
import { useSectionCollectionsCellSelection } from "@/hooks/useSectionCollectionsCellSelection";
import { runSectionCellBulkAction } from "@/lib/billing/runSectionCellBulkAction";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import { SectionCollectionsKpisCard } from "./SectionCollectionsKpisCard";
import { SectionCollectionsMatrixTable } from "./SectionCollectionsMatrixTable";
import { SectionCollectionsBulkMessageModal } from "./SectionCollectionsBulkMessageModal";
import { SectionCollectionsCellActionBar, type SectionCellBulkAction } from "./SectionCollectionsCellActionBar";
import { SectionCollectionsCellActionModal } from "./SectionCollectionsCellActionModal";
import { SectionCollectionsMatrixToolbar } from "./SectionCollectionsMatrixToolbar";

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

  const showEnrollmentFeeColumn = view.students.some(
    (s) => (s.enrollmentFee?.amount ?? 0) > 0,
  );

  const cellSelection = useSectionCollectionsCellSelection({
    students: view.students,
    year: view.year,
    sectionStartsOn: view.sectionStartsOn,
    todayMonth: view.todayMonth,
    showEnrollmentFeeColumn,
  });

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

  return (
    <div className="flex flex-col gap-4">
      <SectionCollectionsKpisCard kpis={view.kpis} dict={dict} locale={locale} currency={currency} />

      <SectionCollectionsMatrixToolbar
        dict={dict}
        billingLabels={billingLabels}
        locale={locale}
        sectionId={view.sectionId}
        year={view.year}
        studentCount={view.students.length}
        recipientIds={recipientIds}
        overdueIds={overdueIds}
        selectionCount={selectionCount}
        overdueNotice={overdueNotice}
        cellActionNotice={cellActionNotice}
        overdueBusy={overdueBusy}
        referenceMonthlyAmount={view.referenceMonthlyFeeAmount}
        referenceMonthlyCurrency={view.referenceMonthlyFeeCurrency}
        onSelectOverdue={selectOverdue}
        onClearSelection={clearSelection}
        onOpenMessageModal={() => setModalOpen(true)}
        onSendOverdueReminders={handleSendOverdueReminders}
        onBulkScholarshipNotice={onBulkScholarshipNotice}
      />

      {cellSelection.selectionCount > 0 ? (
        <SectionCollectionsCellActionBar
          cellCount={cellSelection.selectionCount}
          studentCount={cellSelection.selectedStudents.size}
          selectionMode={cellSelection.selectionMode}
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
        isCellSelectable={cellSelection.isCellSelectable}
        onToggleCell={cellSelection.toggleCell}
        showEnrollmentFeeColumn={showEnrollmentFeeColumn}
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
        billingLabels={billingLabels}
        locale={locale as Locale}
        referenceMonthlyAmount={view.referenceMonthlyFeeAmount}
        referenceMonthlyCurrency={view.referenceMonthlyFeeCurrency}
      />
    </div>
  );
}
