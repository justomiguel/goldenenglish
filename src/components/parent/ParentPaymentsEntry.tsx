"use client";

import { Suspense, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/atoms/Label";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { ParentPaymentsScreenPwa } from "@/components/pwa/organisms/ParentPaymentsScreenPwa";
import { StudentPaymentsHistory } from "@/components/student/StudentPaymentsHistory";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import { StudentMonthlyPaymentsStrip } from "@/components/student/StudentMonthlyPaymentsStrip";
import { StudentPaymentsScreenTabs } from "@/components/student/StudentPaymentsScreenTabs";
import {
  type SubmitMonthlyReceiptAction,
  type StartOnlineMonthlyPaymentClientAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type { SubmitEnrollmentFeeReceiptAction } from "@/components/molecules/StudentEnrollmentFeeUpload";
import { ParentFinanceTabs } from "@/components/parent/ParentFinanceTabs";
import type { FamilyPaymentsSummary } from "@/lib/billing/buildFamilyPaymentsSummary";
import type { StudentPaymentsFocusKey } from "@/lib/billing/findStudentPaymentsInitialFocus";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

type ParentLabels = Dictionary["dashboard"]["parent"];
type StudentLabels = Dictionary["dashboard"]["student"];

export interface TutorLinkedStudentOption {
  studentId: string;
  displayName: string;
  financialAccessActive: boolean;
}

export interface ParentPaymentsEntryProps {
  locale: Locale;
  title: string;
  lead: string;
  options: TutorLinkedStudentOption[];
  selectedStudentId: string | null;
  monthlyView: StudentMonthlyPaymentsView | null;
  familySummary: FamilyPaymentsSummary;
  payments: StudentPaymentRow[];
  financialAccessRevoked: boolean;
  labels: ParentLabels;
  studentLabels: StudentLabels;
  submitReceiptAction: SubmitMonthlyReceiptAction;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  startFlowMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  enabledOnlineGateways?: PaymentGatewayProvider[];
  fileUploadProgress: FileUploadProgressLabels;
  feesPanel: ReactNode;
  initialFocus?: StudentPaymentsFocusKey | null;
}

function ParentPaymentsBodyDesktop({
  locale,
  title,
  lead,
  options,
  selectedStudentId,
  monthlyView,
  payments,
  financialAccessRevoked,
  labels,
  studentLabels,
  submitReceiptAction,
  submitEnrollmentFeeReceiptAction,
  fileUploadProgress,
  startFlowMonthlyPaymentAction,
  startMercadoPagoMonthlyPaymentAction,
  enabledOnlineGateways = [],
  feesPanel,
  initialFocus = null,
}: ParentPaymentsEntryProps) {
  const router = useRouter();

  function onChangeStudent(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("studentId", next);
    else url.searchParams.delete("studentId");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const payPanel =
    options.length === 0 ? (
      <section
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-foreground)]"
        role="status"
      >
        {labels.paymentsNoLinkedStudents}
      </section>
    ) : (
      <>
        <div className="max-w-sm">
          <Label htmlFor="tutor-payments-picker">{labels.paymentsPickerLabel}</Label>
          <select
            id="tutor-payments-picker"
            name="studentId"
            value={selectedStudentId ?? ""}
            onChange={onChangeStudent}
            className="mt-1 block min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            aria-describedby="tutor-payments-picker-hint"
          >
            {options.map((option) => (
              <option key={option.studentId} value={option.studentId}>
                {option.displayName}
              </option>
            ))}
          </select>
          <p id="tutor-payments-picker-hint" className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.paymentsPickerHint}
          </p>
        </div>

        {financialAccessRevoked ? (
          <section
            className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
            role="status"
            aria-live="polite"
          >
            <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
              {labels.paymentsAccessRevokedTitle}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {labels.paymentsAccessRevokedBody}
            </p>
          </section>
        ) : monthlyView && selectedStudentId ? (
          <StudentPaymentsScreenTabs
            ariaLabel={studentLabels.paymentsScreenTabsAria}
            overviewTabLabel={studentLabels.paymentsTabOverview}
            historyTabLabel={studentLabels.paymentsHistory}
            overview={
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
              />
            }
            history={<StudentPaymentsHistory rows={payments} labels={studentLabels} locale={locale} />}
          />
        ) : (
          <StudentPaymentsHistory rows={payments} labels={studentLabels} locale={locale} />
        )}
      </>
    );

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)] sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <ParentFinanceTabs labels={labels} payPanel={payPanel} feesPanel={feesPanel} />
    </>
  );
}

export function ParentPaymentsEntry(props: ParentPaymentsEntryProps) {
  const skeleton = (
    <div className="h-24 animate-pulse rounded bg-[var(--color-muted)]" aria-hidden />
  );

  return (
    <Suspense fallback={skeleton}>
      <SurfaceMountGate
        skeleton={skeleton}
        desktop={<ParentPaymentsBodyDesktop {...props} />}
        narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
          <PwaPageShell surface={surface}>
            <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
              <div className="mx-auto max-w-[var(--layout-max-width)] py-2">
                <ParentPaymentsScreenPwa {...props} />
              </div>
            </div>
          </PwaPageShell>
        )}
      />
    </Suspense>
  );
}
