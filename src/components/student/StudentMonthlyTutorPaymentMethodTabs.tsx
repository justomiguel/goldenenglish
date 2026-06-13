"use client";

import { useId, useMemo, useState } from "react";
import { Upload, Wallet } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { StudentMonthlyPaymentReceiptUploadForm } from "@/components/student/StudentMonthlyPaymentReceiptUploadForm";
import { OnlineMonthlyPaymentCheckoutPanel } from "@/components/molecules/OnlineMonthlyPaymentCheckoutPanel";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentCell, StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

const TAB_RECEIPT = "receipt";
const TAB_ONLINE = "online";

export interface StudentMonthlyTutorPaymentMethodTabsProps {
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
  onSubmitReceipt: (formData: FormData) => void | Promise<void>;
  onOnlinePay: (provider: PaymentGatewayProvider) => void | Promise<void>;
  compactTopSpacing?: boolean;
  bankTransferInstructions?: string | null;
}

export function StudentMonthlyTutorPaymentMethodTabs({
  locale,
  studentId,
  section,
  cell,
  labels,
  paymentLabels,
  fileUploadProgress,
  expected,
  showOnlinePay,
  enabledOnlineGateways,
  busy,
  onlineBusy,
  feedbackMessage,
  onSubmitReceipt,
  onOnlinePay,
  compactTopSpacing = false,
  bankTransferInstructions = null,
}: StudentMonthlyTutorPaymentMethodTabsProps) {
  const reactId = useId().replace(/:/g, "");
  const [tab, setTab] = useState<string>(TAB_RECEIPT);

  const effectiveTab = showOnlinePay ? tab : TAB_RECEIPT;

  const items: UnderlineTabItem[] = useMemo(
    () => [
      { id: TAB_RECEIPT, label: labels.tutorMonthlyTabReceipt, Icon: Upload },
      {
        id: TAB_ONLINE,
        label: labels.tutorMonthlyTabOnline,
        Icon: Wallet,
        disabled: !showOnlinePay,
        title: !showOnlinePay ? labels.tutorMonthlyPayOnlineUnavailableLead : undefined,
      },
    ],
    [labels.tutorMonthlyPayOnlineUnavailableLead, labels.tutorMonthlyTabOnline, labels.tutorMonthlyTabReceipt, showOnlinePay],
  );

  return (
    <div className={compactTopSpacing ? "mt-2 min-w-0" : "mt-4 min-w-0"}>
      <UnderlineTabBar
        idPrefix={`tutor-pay-${reactId}`}
        ariaLabel={labels.paymentMethodTabsAria}
        items={items}
        value={effectiveTab}
        onChange={setTab}
      />
      <div
        id={underlinePanelId(`tutor-pay-${reactId}`, TAB_RECEIPT)}
        role="tabpanel"
        aria-labelledby={underlineTabId(`tutor-pay-${reactId}`, TAB_RECEIPT)}
        hidden={effectiveTab !== TAB_RECEIPT}
        className="min-w-0 pt-4"
      >
        <StudentMonthlyPaymentReceiptUploadForm
          locale={locale}
          studentId={studentId}
          sectionId={section.sectionId}
          month={cell.month}
          year={cell.year}
          expected={expected}
          monthlyLabels={labels}
          paymentLabels={paymentLabels}
          fileUploadProgress={fileUploadProgress}
          busy={busy}
          onlineBusy={onlineBusy}
          showOnlinePay={false}
          enabledOnlineGateways={[]}
          feedbackMessage={feedbackMessage}
          bankTransferInstructions={bankTransferInstructions}
          onSubmit={onSubmitReceipt}
          onOnlinePay={onOnlinePay}
        />
      </div>
      <div
        id={underlinePanelId(`tutor-pay-${reactId}`, TAB_ONLINE)}
        role="tabpanel"
        aria-labelledby={underlineTabId(`tutor-pay-${reactId}`, TAB_ONLINE)}
        hidden={effectiveTab !== TAB_ONLINE}
        className="min-w-0 pt-4"
      >
        {showOnlinePay ? (
          <OnlineMonthlyPaymentCheckoutPanel
            labels={labels}
            enabledGateways={enabledOnlineGateways}
            busy={busy}
            onlineBusy={onlineBusy}
            feedbackMessage={feedbackMessage}
            onPay={onOnlinePay}
          />
        ) : null}
      </div>
    </div>
  );
}
