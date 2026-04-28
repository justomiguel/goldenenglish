import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

/** Short status line under month-0 chip (aligned with monthly matrix legend copy). */
export function enrollmentFeeMatrixStatusLabel(
  visual: { status: StudentMonthlyPaymentCell["status"]; isOverdue: boolean },
  labels: {
    statusPaid: string;
    statusPending: string;
    statusRejected: string;
    statusExempt: string;
    statusUnpaid: string;
    statusOverdue: string;
  },
): string {
  switch (visual.status) {
    case "approved":
      return labels.statusPaid;
    case "pending":
      return labels.statusPending;
    case "rejected":
      return labels.statusRejected;
    case "exempt":
      return labels.statusExempt;
    case "due":
      return visual.isOverdue ? labels.statusOverdue : labels.statusUnpaid;
    default:
      return labels.statusUnpaid;
  }
}
