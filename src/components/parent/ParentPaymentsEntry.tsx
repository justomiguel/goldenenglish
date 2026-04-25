"use client";

import { type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { Label } from "@/components/atoms/Label";
import { StudentPaymentsHistory } from "@/components/student/StudentPaymentsHistory";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import { StudentMonthlyPaymentsStrip } from "@/components/student/StudentMonthlyPaymentsStrip";
import { type SubmitMonthlyReceiptAction } from "@/components/student/StudentMonthlyPaymentFocus";
import type { SubmitEnrollmentFeeReceiptAction } from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary, Locale } from "@/types/i18n";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

type ParentLabels = Dictionary["dashboard"]["parent"];
type StudentLabels = Dictionary["dashboard"]["student"];

/**
 * Resumen del alumno enlazado tal y como lo necesita el picker del tutor.
 * `financialAccessActive=false` ⇒ el alumno mayor revocó el acceso; el tutor
 * lo ve en el picker pero no puede operar la tira hasta que se restaure.
 */
export interface TutorLinkedStudentOption {
  studentId: string;
  displayName: string;
  financialAccessActive: boolean;
}

function ParentPaymentsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface ParentPaymentsEntryProps {
  locale: Locale;
  title: string;
  lead: string;
  /** Alumnos enlazados al tutor (ya ordenados alfabéticamente). */
  options: TutorLinkedStudentOption[];
  /** Alumno actualmente seleccionado en el picker; null si no hay vinculados. */
  selectedStudentId: string | null;
  /**
   * Vista mensual del alumno seleccionado. `null` cuando no hay vínculos o
   * cuando el alumno revocó el acceso financiero del tutor.
   */
  monthlyView: StudentMonthlyPaymentsView | null;
  /** Historial reciente del alumno seleccionado (vacío si revocado). */
  payments: StudentPaymentRow[];
  /** True cuando el alumno seleccionado revocó el acceso financiero. */
  financialAccessRevoked: boolean;
  labels: ParentLabels;
  studentLabels: StudentLabels;
  /** Server action que sube el comprobante mensual en nombre del alumno. */
  submitReceiptAction: SubmitMonthlyReceiptAction;
  /** Server action que sube el comprobante de matrícula en nombre del alumno. */
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
}

export function ParentPaymentsEntry({
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
}: ParentPaymentsEntryProps) {
  const router = useRouter();

  function onChangeStudent(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("studentId", next);
    else url.searchParams.delete("studentId");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const body = (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>

      {options.length === 0 ? (
        <section
          className="mt-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {labels.paymentsNoLinkedStudents}
        </section>
      ) : (
        <>
          <div className="mt-6 max-w-sm">
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
            <p
              id="tutor-payments-picker-hint"
              className="mt-1 text-xs text-[var(--color-muted-foreground)]"
            >
              {labels.paymentsPickerHint}
            </p>
          </div>

          {financialAccessRevoked ? (
            <section
              className="mt-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
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
          ) : (
            <>
              {monthlyView && selectedStudentId ? (
                <StudentMonthlyPaymentsStrip
                  locale={locale}
                  studentId={selectedStudentId}
                  view={monthlyView}
                  labels={studentLabels.monthly}
                  paymentLabels={studentLabels}
                  submitAction={submitReceiptAction}
                  submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceiptAction}
                  receiptExpectedUsesFullMonth
                />
              ) : null}
              <h2 className="mt-10 font-display text-xl font-semibold text-[var(--color-primary)]">
                {studentLabels.paymentsHistory}
              </h2>
              <StudentPaymentsHistory rows={payments} labels={studentLabels} />
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<ParentPaymentsSkeleton />}
      desktop={<div>{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
