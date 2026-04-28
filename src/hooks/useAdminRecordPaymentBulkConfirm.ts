import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { RecordPaymentBulkAction } from "@/components/dashboard/AdminRecordPaymentActionBar";
import {
  runRecordPaymentExemptBulk,
  runRecordPaymentPaidBulk,
  runRecordPaymentScholarshipBulk,
} from "@/lib/dashboard/adminRecordPaymentBulkRunners";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export function useAdminRecordPaymentBulkConfirm(args: {
  locale: Locale;
  studentId: string;
  sectionId: string;
  year: number;
  labels: BillingLabels;
  selected: Set<number>;
  pendingAction: RecordPaymentBulkAction | null;
  scholarshipConfirmReady: boolean;
  exemptConfirmReady: boolean;
  modalAdminNote: string;
  modalScholarshipPercent: string;
  setBusy: (v: boolean) => void;
  setMsg: (v: string | null) => void;
  setSelected: (v: Set<number>) => void;
  setPendingAction: (v: RecordPaymentBulkAction | null) => void;
  resetModalFields: () => void;
  nSelected: number;
}) {
  const router = useRouter();
  const {
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
  } = args;

  const onConfirm = useCallback(async () => {
    if (!pendingAction) return;
    const months = Array.from(selected).sort((a, b) => a - b);
    if (months.length === 0) return;
    if (pendingAction === "scholarship" && !scholarshipConfirmReady) return;
    if (pendingAction === "exempt" && !exemptConfirmReady) return;
    setBusy(true);
    setMsg(null);
    try {
      const r =
        pendingAction === "paid"
          ? await runRecordPaymentPaidBulk({
              studentId,
              sectionId,
              year,
              months,
              locale,
              adminNote: modalAdminNote.trim() || undefined,
              labels,
            })
          : pendingAction === "exempt"
            ? await runRecordPaymentExemptBulk({
                locale,
                studentId,
                sectionId,
                year,
                months,
                adminNote: modalAdminNote,
                labels,
              })
            : await runRecordPaymentScholarshipBulk({
                locale,
                studentId,
                sectionId,
                year,
                months,
                discountPercent: Number(modalScholarshipPercent),
                note: modalAdminNote.trim() || undefined,
                labels,
              });
      if (!r.ok) {
        setMsg(r.message);
        return;
      }
      setMsg(r.message);
      setSelected(new Set());
      setPendingAction(null);
      resetModalFields();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [
    pendingAction,
    selected,
    scholarshipConfirmReady,
    exemptConfirmReady,
    setBusy,
    setMsg,
    studentId,
    sectionId,
    year,
    locale,
    modalAdminNote,
    modalScholarshipPercent,
    labels,
    setSelected,
    setPendingAction,
    resetModalFields,
    router,
  ]);

  const confirmTitle =
    pendingAction === "paid"
      ? labels.recordPaymentBulkConfirmTitle.replace("{count}", String(nSelected))
      : pendingAction === "scholarship"
        ? labels.recordPaymentScholarshipConfirmTitle.replace("{count}", String(nSelected))
        : pendingAction === "exempt"
          ? labels.recordPaymentExemptConfirmTitle.replace("{count}", String(nSelected))
          : "";

  const confirmDescription =
    pendingAction === "paid"
      ? labels.recordPaymentBulkConfirmBody
      : pendingAction === "scholarship"
        ? labels.recordPaymentScholarshipConfirmBody
        : pendingAction === "exempt"
          ? labels.recordPaymentExemptConfirmBody
          : undefined;

  const confirmHidden =
    pendingAction === "scholarship"
      ? !scholarshipConfirmReady
      : pendingAction === "exempt"
        ? !exemptConfirmReady
        : false;

  return { onConfirm, confirmTitle, confirmDescription, confirmHidden };
}
