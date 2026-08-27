import type {
  StartOnlineMonthlyPaymentClientAction,
  SubmitMonthlyReceiptAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { SubmitEnrollmentFeeReceiptAction } from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

type GridLegend = Dictionary["dashboard"]["student"]["paymentsPwa"]["legend"];
type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];
type PaymentLabels = Dictionary["dashboard"]["student"];

export interface MonthlyPaymentsSectionAccordionProps {
  locale: Locale;
  studentId: string;
  row: StudentMonthlyPaymentSectionRow;
  sectionSettled: boolean;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  expandLabel: string;
  collapseLabel: string;
  visibleCells: StudentMonthlyPaymentSectionRow["cells"];
  monthLabels: string[];
  labels: MonthlyLabels;
  paymentLabels: PaymentLabels;
  gridLegendLabels: GridLegend;
  monthsToPayTitle: string;
  monthDetailHint: string;
  detailPanelTitle: string;
  enrollmentFeeChipLabel: string;
  stripAria: string;
  isFocusedSection: boolean;
  isEnrollmentFocus: boolean;
  focusMonth: number | null;
  onFocusMonth: (month: number) => void;
  onFocusEnrollment: () => void;
  focusedCell: StudentMonthlyPaymentSectionRow["cells"][number] | null;
  submitAction: SubmitMonthlyReceiptAction;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  receiptExpectedUsesFullMonth: boolean;
  fileUploadProgress: FileUploadProgressLabels;
  startFlowMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  enabledOnlineGateways: PaymentGatewayProvider[];
  tutorPaymentMethodTabs: boolean;
  onSubmitted: () => void;
  bankTransferInstructions?: string | null;
  parentReviewHref?: (sectionId: string, month: number, year: number) => string;
  parentReviewCtaLabel?: string;
}
