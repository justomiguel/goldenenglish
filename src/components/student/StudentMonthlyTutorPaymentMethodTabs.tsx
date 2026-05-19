"use client";

import { useId, useMemo, useState } from "react";
import { Upload, Wallet } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { StudentMonthlyPaymentReceiptUploadForm } from "@/components/student/StudentMonthlyPaymentReceiptUploadForm";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentCell, StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

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
  showFlowPay: boolean;
  busy: boolean;
  flowBusy: boolean;
  feedbackMessage: string | null;
  onSubmitReceipt: (formData: FormData) => void | Promise<void>;
  onFlowPay: () => void | Promise<void>;
  /** When embedded below the month grid, reduce outer top margin vs standalone card chrome. */
  compactTopSpacing?: boolean;
}

/**
 * Tutor payments: splits “upload receipt” vs “pay online” into two underline tabs inside the monthly focus panel.
 */
export function StudentMonthlyTutorPaymentMethodTabs({
  locale,
  studentId,
  section,
  cell,
  labels,
  paymentLabels,
  fileUploadProgress,
  expected,
  showFlowPay,
  busy,
  flowBusy,
  feedbackMessage,
  onSubmitReceipt,
  onFlowPay,
  compactTopSpacing = false,
}: StudentMonthlyTutorPaymentMethodTabsProps) {
  const reactId = useId().replace(/:/g, "");
  const [tab, setTab] = useState<string>(TAB_RECEIPT);

  const effectiveTab = showFlowPay ? tab : TAB_RECEIPT;

  const items: UnderlineTabItem[] = useMemo(
    () => [
      { id: TAB_RECEIPT, label: labels.tutorMonthlyTabReceipt, Icon: Upload },
      {
        id: TAB_ONLINE,
        label: labels.tutorMonthlyTabOnline,
        Icon: Wallet,
        disabled: !showFlowPay,
        title: !showFlowPay ? labels.tutorMonthlyPayOnlineUnavailableLead : undefined,
      },
    ],
    [labels.tutorMonthlyPayOnlineUnavailableLead, labels.tutorMonthlyTabOnline, labels.tutorMonthlyTabReceipt, showFlowPay],
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
          flowBusy={flowBusy}
          showFlowPay={false}
          feedbackMessage={feedbackMessage}
          onSubmit={onSubmitReceipt}
          onFlowPay={onFlowPay}
        />
      </div>
      <div
        id={underlinePanelId(`tutor-pay-${reactId}`, TAB_ONLINE)}
        role="tabpanel"
        aria-labelledby={underlineTabId(`tutor-pay-${reactId}`, TAB_ONLINE)}
        hidden={effectiveTab !== TAB_ONLINE}
        className="min-w-0 pt-4"
      >
        {showFlowPay ? (
          <div className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">{labels.payWithFlowHint}</p>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || flowBusy}
              isLoading={flowBusy}
              onClick={() => void onFlowPay()}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {!flowBusy ? <Wallet className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {labels.payWithFlow}
            </Button>
            {feedbackMessage ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">{feedbackMessage}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
