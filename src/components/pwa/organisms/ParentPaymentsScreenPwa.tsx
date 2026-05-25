"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ParentPaymentsFamilyHero } from "@/components/pwa/molecules/ParentPaymentsFamilyHero";
import { ParentPaymentsStudentPicker } from "@/components/pwa/molecules/ParentPaymentsStudentPicker";
import { StudentMonthlyPaymentsStrip } from "@/components/student/StudentMonthlyPaymentsStrip";
import type { SubmitMonthlyReceiptAction, StartOnlineMonthlyPaymentClientAction } from "@/components/student/StudentMonthlyPaymentFocus";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type { SubmitEnrollmentFeeReceiptAction } from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { FamilyPaymentsSummary } from "@/lib/billing/buildFamilyPaymentsSummary";
import type { StudentPaymentsFocusKey } from "@/lib/billing/findStudentPaymentsInitialFocus";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";
import type { TutorLinkedStudentOption } from "@/components/parent/ParentPaymentsEntry";

type ParentLabels = Dictionary["dashboard"]["parent"];
type StudentLabels = Dictionary["dashboard"]["student"];

export interface ParentPaymentsScreenPwaProps {
  locale: Locale;
  title: string;
  lead: string;
  options: TutorLinkedStudentOption[];
  selectedStudentId: string | null;
  monthlyView: StudentMonthlyPaymentsView | null;
  familySummary: FamilyPaymentsSummary;
  financialAccessRevoked: boolean;
  labels: ParentLabels;
  studentLabels: StudentLabels;
  submitReceiptAction: SubmitMonthlyReceiptAction;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  startFlowMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  enabledOnlineGateways?: PaymentGatewayProvider[];
  fileUploadProgress: FileUploadProgressLabels;
  initialFocus?: StudentPaymentsFocusKey | null;
}

export function ParentPaymentsScreenPwa({
  locale,
  title,
  lead,
  options,
  selectedStudentId,
  monthlyView,
  familySummary,
  financialAccessRevoked,
  labels,
  studentLabels,
  submitReceiptAction,
  submitEnrollmentFeeReceiptAction,
  fileUploadProgress,
  startFlowMonthlyPaymentAction,
  startMercadoPagoMonthlyPaymentAction,
  enabledOnlineGateways = [],
  initialFocus = null,
}: ParentPaymentsScreenPwaProps) {
  const router = useRouter();
  const pwaLabels = labels.paymentsPwa;

  function onChangeStudent(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("studentId", next);
    else url.searchParams.delete("studentId");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      </header>

      {options.length === 0 ? (
        <section
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {labels.paymentsNoLinkedStudents}
        </section>
      ) : (
        <>
          <ParentPaymentsFamilyHero
            locale={locale}
            labels={pwaLabels}
            year={familySummary.year}
            familyTotalPending={familySummary.familyTotalPending}
            isFamilySettled={familySummary.isFamilySettled}
          />

          <ParentPaymentsStudentPicker
            locale={locale}
            pickerLabel={labels.paymentsPickerLabel}
            options={options}
            selectedStudentId={selectedStudentId}
            familySummary={familySummary}
            pwaLabels={pwaLabels}
            onChange={onChangeStudent}
          />

          {financialAccessRevoked ? (
            <section
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              role="status"
            >
              <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
                {labels.paymentsAccessRevokedTitle}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {labels.paymentsAccessRevokedBody}
              </p>
            </section>
          ) : monthlyView && selectedStudentId ? (
            <StudentMonthlyPaymentsStrip
              locale={locale}
              studentId={selectedStudentId}
              view={monthlyView}
              labels={studentLabels.monthly}
              paymentLabels={studentLabels}
              submitAction={submitReceiptAction}
              submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceiptAction}
              receiptExpectedUsesFullMonth
              fileUploadProgress={fileUploadProgress}
              startFlowMonthlyPaymentAction={startFlowMonthlyPaymentAction}
              startMercadoPagoMonthlyPaymentAction={startMercadoPagoMonthlyPaymentAction}
              enabledOnlineGateways={enabledOnlineGateways}
              tutorPaymentMethodTabs
              initialFocus={initialFocus}
              hideNonBillableMonths
              pwaSectionAccordion
              gridLegendLabels={pwaLabels.legend}
              pwaSectionLabels={{
                expandSection: pwaLabels.expandSection,
                collapseSection: pwaLabels.collapseSection,
                monthsToPayTitle: pwaLabels.monthsToPayTitle,
                monthDetailHint: pwaLabels.monthDetailHint,
                enrollmentFeeChipLabel: pwaLabels.enrollmentFeeChipLabel,
                detailPanelTitle: pwaLabels.detailPanelTitle,
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
