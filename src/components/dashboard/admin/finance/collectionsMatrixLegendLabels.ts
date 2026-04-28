import type { AdminBillingMatrixLegendModalLabels } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import type { Dictionary } from "@/types/i18n";

export function financeCollectionsMatrixLegendLabels(
  dict: Dictionary["admin"]["finance"]["collections"],
): AdminBillingMatrixLegendModalLabels {
  const { matrix, monthCell, bulk } = dict;
  return {
    openButton: matrix.legendOpenButton,
    modalTitle: matrix.legendModalTitle,
    matrixLegend: matrix.legendModalBody,
    cancelLabel: bulk.messageCancel,
    statusPaid: monthCell.statusApproved,
    statusPending: monthCell.statusPending,
    statusRejected: monthCell.statusRejected,
    statusExempt: monthCell.statusExempt,
    statusUnpaid: monthCell.statusDue,
    statusOverdue: matrix.legendStatusOverdue,
    statusNoPlan: monthCell.statusNoPlan,
    statusOutOfPeriod: monthCell.statusOutOfPeriod,
    matrixLegendScholarshipSample: matrix.legendScholarshipSample,
  };
}
