"use client";

import { StudentMonthlyPaymentReceiptUploadForm } from "@/components/student/StudentMonthlyPaymentReceiptUploadForm";
import { StudentMonthlyTutorPaymentMethodTabs } from "@/components/student/StudentMonthlyTutorPaymentMethodTabs";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { Dictionary, Locale } from "@/types/i18n";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

export function StudentMonthlyPaymentFocusPayMethods(props: {
  locale: Locale;
  studentId: string;
  section: StudentMonthlyPaymentSectionRow;
  cell: StudentMonthlyPaymentCell;
  labels: Labels;
  paymentLabels: Dictionary["dashboard"]["student"];
  fileUploadProgress: FileUploadProgressLabels;
  expected: number | null;
  showOnlinePay: boolean;
  enabledOnlineGateways: PaymentGatewayProvider[];
  busy: boolean;
  onlineBusy: boolean;
  feedbackMessage: string | null;
  paymentMethodTabLayout: boolean;
  embeddedInSectionCard: boolean;
  bankTransferInstructions: string | null;
  onSubmitReceipt: (formData: FormData) => void | Promise<void>;
  onOnlinePay: (provider: PaymentGatewayProvider) => void | Promise<void>;
}) {
  if (props.paymentMethodTabLayout) {
    return (
      <StudentMonthlyTutorPaymentMethodTabs
        key={`${props.section.sectionId}-${props.cell.year}-${props.cell.month}`}
        locale={props.locale}
        studentId={props.studentId}
        section={props.section}
        cell={props.cell}
        labels={props.labels}
        paymentLabels={props.paymentLabels}
        fileUploadProgress={props.fileUploadProgress}
        expected={props.expected}
        showOnlinePay={props.showOnlinePay}
        enabledOnlineGateways={props.enabledOnlineGateways}
        busy={props.busy}
        onlineBusy={props.onlineBusy}
        feedbackMessage={props.feedbackMessage}
        onSubmitReceipt={props.onSubmitReceipt}
        onOnlinePay={props.onOnlinePay}
        compactTopSpacing={props.embeddedInSectionCard}
        bankTransferInstructions={props.bankTransferInstructions}
      />
    );
  }

  return (
    <StudentMonthlyPaymentReceiptUploadForm
      locale={props.locale}
      studentId={props.studentId}
      sectionId={props.section.sectionId}
      month={props.cell.month}
      year={props.cell.year}
      expected={props.expected}
      monthlyLabels={props.labels}
      paymentLabels={props.paymentLabels}
      fileUploadProgress={props.fileUploadProgress}
      busy={props.busy}
      onlineBusy={props.onlineBusy}
      showOnlinePay={props.showOnlinePay}
      enabledOnlineGateways={props.enabledOnlineGateways}
      feedbackMessage={props.feedbackMessage}
      bankTransferInstructions={props.bankTransferInstructions}
      onSubmit={props.onSubmitReceipt}
      onOnlinePay={props.onOnlinePay}
    />
  );
}
