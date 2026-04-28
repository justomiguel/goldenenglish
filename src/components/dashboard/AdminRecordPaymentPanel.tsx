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
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { useAdminRecordPaymentBulkConfirm } from "@/hooks/useAdminRecordPaymentBulkConfirm";
import { useAdminRecordPaymentPanelLabels } from "@/hooks/useAdminRecordPaymentPanelLabels";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import type { Dictionary, Locale } from "@/types/i18n";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

type BillingLabels = Dictionary["admin"]["billing"];

export type AdminRecordPaymentEnrollmentFeeSnapshot = {
  enrollmentId: string | null;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
  receiptSignedUrl: string | null;
  receiptStatus: "pending" | "approved" | "rejected" | null;
};

export interface AdminRecordPaymentPanelProps {
  locale: Locale;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  year: number;
  monthStates: AdminBillingMonthState[];
  /** When set, monthly chips match Cobranzas (`buildStudentMonthlyPaymentsRow`). */
  collectionCells?: StudentMonthlyPaymentCell[] | null;
  labels: BillingLabels;
  showEnrollmentMonthZero: boolean;
  enrollmentMonthZeroVisual: {
    status: StudentMonthlyPaymentCell["status"];
    isOverdue: boolean;
  } | null;
  /** Enrollment row fields when the section charges matrícula — enables opening the enrollment modal from column “0”. */
  enrollmentFeeModal?: AdminRecordPaymentEnrollmentFeeSnapshot | null;
  /** Omit outer card chrome when nested inside admin billing section card. */
  embedded?: boolean;
}

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
  showEnrollmentMonthZero,
  enrollmentMonthZeroVisual,
  enrollmentFeeModal = null,
  embedded = false,
}: AdminRecordPaymentPanelProps) {
  const paidNoteId = useId();
  const scholarshipPctId = useId();
  const scholarshipNoteId = useId();
  const exemptNoteId = useId();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modalScholarshipPercent, setModalScholarshipPercent] = useState("");
  const [modalAdminNote, setModalAdminNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<RecordPaymentBulkAction | null>(null);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);

  const nSelected = selected.size;
  const hasSelection = nSelected > 0;

  const scholarshipPctNum = Number(modalScholarshipPercent);
  const scholarshipConfirmReady =
    Number.isFinite(scholarshipPctNum) &&
    scholarshipPctNum >= 1 &&
    scholarshipPctNum <= 100;
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
  });

  function resetModalFields() {
    setModalScholarshipPercent("");
    setModalAdminNote("");
  }

  const { onConfirm, confirmTitle, confirmDescription, confirmHidden } = useAdminRecordPaymentBulkConfirm({
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
    modalScholarshipPercent,
    setBusy,
    setMsg,
    setSelected,
    setPendingAction,
    resetModalFields,
    nSelected,
  });

  function toggleMonth(m: number, next: boolean) {
    setSelected((prev) => {
      const c = new Set(prev);
      if (next) c.add(m);
      else c.delete(m);
      return c;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setPendingAction(null);
    resetModalFields();
  }

  function requestAction(action: RecordPaymentBulkAction) {
    if (!hasSelection || busy) return;
    resetModalFields();
    setMsg(null);
    setPendingAction(action);
  }

  const shellClass = embedded
    ? "space-y-4 border-t border-[var(--color-border)]/80 pt-4"
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm";

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

      {hasSelection ? (
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
            scholarshipPctId={scholarshipPctId}
            scholarshipNoteId={scholarshipNoteId}
            exemptNoteId={exemptNoteId}
            modalAdminNote={modalAdminNote}
            modalScholarshipPercent={modalScholarshipPercent}
            scholarshipConfirmReady={scholarshipConfirmReady}
            busy={busy}
            labels={labels}
            onAdminNoteChange={setModalAdminNote}
            onScholarshipPercentChange={setModalScholarshipPercent}
          />
        }
        cancelLabel={labels.cancel}
        confirmLabel={labels.recordPaymentConfirm}
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
