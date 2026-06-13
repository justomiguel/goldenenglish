"use client";

import { useId, useState } from "react";
import {
  AdminRecordPaymentActionBar,
  type RecordPaymentBulkAction,
} from "@/components/dashboard/AdminRecordPaymentActionBar";
import { AdminRecordPaymentBulkConfirmForm } from "@/components/dashboard/AdminRecordPaymentBulkConfirmForm";
import { AdminRecordPaymentEnrollmentModal } from "@/components/dashboard/AdminRecordPaymentEnrollmentModal";
import { AdminRecordPaymentMonthGrid } from "@/components/dashboard/AdminRecordPaymentMonthGrid";
import { AdminRecordPaymentPanelHeader } from "@/components/dashboard/AdminRecordPaymentPanelHeader";
import { AdminRecordPaymentRevertBar } from "@/components/dashboard/AdminRecordPaymentRevertBar";
import type {
  AdminRecordPaymentPanelProps,
  AdminRecordPaymentEnrollmentFeeSnapshot,
} from "@/components/dashboard/adminRecordPaymentPanelTypes";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { useAdminRecordPaymentBulkConfirm } from "@/hooks/useAdminRecordPaymentBulkConfirm";
import { useAdminRecordPaymentMonthSelection } from "@/hooks/useAdminRecordPaymentMonthSelection";
import { useAdminRecordPaymentPanelLabels } from "@/hooks/useAdminRecordPaymentPanelLabels";

export type { AdminRecordPaymentEnrollmentFeeSnapshot };

export function AdminRecordPaymentPanel({
  locale,
  studentId,
  studentName,
  sectionId,
  sectionName,
  year,
  monthStates,
  collectionCells = null,
  labels,
  sectionMonthlyFeeAmount = null,
  sectionMonthlyFeeCurrency = null,
  showEnrollmentMonthZero,
  enrollmentMonthZeroVisual,
  enrollmentFeeModal = null,
  embedded = false,
}: AdminRecordPaymentPanelProps) {
  const paidNoteId = useId();
  const scholarshipNoteId = useId();
  const exemptNoteId = useId();

  const { selected, setSelected, toggleMonth, clearSelection: clearMonths, selectionMode } =
    useAdminRecordPaymentMonthSelection(monthStates);
  const [resolvedScholarshipPercent, setResolvedScholarshipPercent] = useState<number | null>(null);
  const [modalAdminNote, setModalAdminNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<RecordPaymentBulkAction | null>(null);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);

  const nSelected = selected.size;
  const hasSelection = nSelected > 0;

  const scholarshipConfirmReady =
    resolvedScholarshipPercent != null &&
    resolvedScholarshipPercent >= 1 &&
    resolvedScholarshipPercent <= 100;
  const exemptConfirmReady = modalAdminNote.trim().length > 0;

  const { monthGridLabels, enrollmentMonthZero, selectableMonths } = useAdminRecordPaymentPanelLabels({
    labels,
    sectionName,
    studentName,
    showEnrollmentMonthZero,
    enrollmentMonthZeroVisual,
    enrollmentFeeModalOpenSetter: () => setEnrollmentModalOpen(true),
    hasEnrollmentFeeModal: enrollmentFeeModal != null,
    busy,
    monthStates,
    enrollmentFeeReceiptSignedUrl: enrollmentFeeModal?.receiptSignedUrl ?? null,
  });

  function resetModalFields() {
    setResolvedScholarshipPercent(null);
    setModalAdminNote("");
  }

  const { onConfirm, confirmTitle, confirmDescription, confirmHidden, confirmLabel } =
    useAdminRecordPaymentBulkConfirm({
      locale,
      studentId,
      sectionId,
      year,
      labels,
      selected,
      pendingAction,
      scholarshipConfirmReady,
      exemptConfirmReady,
      modalAdminNote,
      resolvedScholarshipPercent,
      setBusy,
      setMsg,
      setSelected,
      setPendingAction,
      resetModalFields,
      nSelected,
    });

  function clearSelection() {
    clearMonths();
    setPendingAction(null);
    resetModalFields();
  }

  function requestAction(action: RecordPaymentBulkAction) {
    if (!hasSelection || busy || action === "revert") return;
    resetModalFields();
    setMsg(null);
    setPendingAction(action);
  }

  function openRevertConfirm() {
    if (!hasSelection || busy || selectionMode !== "revert") return;
    resetModalFields();
    setMsg(null);
    setPendingAction("revert");
  }

  const shellClass = embedded ? "space-y-4 border-t border-[var(--color-border)]/80 pt-4" : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm";

  return (
    <section className={shellClass}>
      <AdminRecordPaymentPanelHeader labels={labels} sectionName={sectionName} year={year} />

      {msg ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {msg}
        </p>
      ) : null}

      <AdminRecordPaymentMonthGrid
        locale={locale}
        viewYear={year}
        selectedMonths={selected}
        monthStates={monthStates}
        collectionCells={collectionCells}
        onToggle={toggleMonth}
        onSelectAll={() => setSelected(new Set(selectableMonths))}
        onClear={clearSelection}
        labels={monthGridLabels}
        disabled={busy}
        enrollmentMonthZero={enrollmentMonthZero}
      />

      {hasSelection && selectionMode === "revert" ? (
        <AdminRecordPaymentRevertBar
          labels={labels}
          selectedCount={nSelected}
          busy={busy}
          onConfirmRevert={openRevertConfirm}
          onClear={clearSelection}
        />
      ) : hasSelection ? (
        <AdminRecordPaymentActionBar
          labels={labels}
          selectedCount={nSelected}
          busy={busy}
          onAction={requestAction}
          onClear={clearSelection}
        />
      ) : null}

      <ConfirmActionModal
        open={pendingAction != null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            resetModalFields();
          }
        }}
        title={confirmTitle}
        description={confirmDescription}
        formSlot={
          <AdminRecordPaymentBulkConfirmForm
            pendingAction={pendingAction}
            paidNoteId={paidNoteId}
            scholarshipNoteId={scholarshipNoteId}
            exemptNoteId={exemptNoteId}
            modalAdminNote={modalAdminNote}
            scholarshipConfirmReady={scholarshipConfirmReady}
            busy={busy}
            locale={locale}
            labels={labels}
            referenceMonthlyAmount={sectionMonthlyFeeAmount}
            referenceMonthlyCurrency={sectionMonthlyFeeCurrency}
            onAdminNoteChange={setModalAdminNote}
            onResolvedScholarshipPercentChange={setResolvedScholarshipPercent}
          />
        }
        cancelLabel={labels.cancel}
        confirmLabel={confirmLabel}
        confirmVariant={pendingAction === "revert" ? "destructive" : "primary"}
        busy={busy}
        disableClose={busy}
        confirmHidden={confirmHidden}
        onConfirm={onConfirm}
      />

      {enrollmentFeeModal ? (
        <AdminRecordPaymentEnrollmentModal
          open={enrollmentModalOpen}
          onOpenChange={setEnrollmentModalOpen}
          locale={locale}
          studentId={studentId}
          sectionId={sectionId}
          sectionName={sectionName}
          enrollmentId={enrollmentFeeModal.enrollmentId}
          labels={labels}
          enrollmentFeeExempt={enrollmentFeeModal.enrollmentFeeExempt}
          enrollmentExemptReason={enrollmentFeeModal.enrollmentExemptReason}
          lastEnrollmentPaidAt={enrollmentFeeModal.lastEnrollmentPaidAt}
          receiptSignedUrl={enrollmentFeeModal.receiptSignedUrl}
          receiptStatus={enrollmentFeeModal.receiptStatus}
        />
      ) : null}
    </section>
  );
}
