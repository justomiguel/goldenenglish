"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { PromotionAppliedBadge } from "@/components/molecules/PromotionAppliedBadge";
import { PromotionApplyForm } from "@/components/molecules/PromotionApplyForm";
import { StudentPaymentForm } from "@/components/student/StudentPaymentForm";
import {
  StudentPaymentsHistory,
  type StudentPaymentRow,
} from "@/components/student/StudentPaymentsHistory";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type StudentLabels = Dictionary["dashboard"]["student"];

function StudentPaymentsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface StudentPaymentsEntryProps {
  locale: Locale;
  studentId: string;
  hasPromotionApplied: boolean;
  title: string;
  lead: string;
  payments: StudentPaymentRow[];
  labels: StudentLabels;
  /** Si está definido, se ocultan formularios de pago (menor con tutor responsable). */
  paymentsBlockedMessage?: string;
}

export function StudentPaymentsEntry({
  locale,
  studentId,
  hasPromotionApplied,
  title,
  lead,
  payments,
  labels,
  paymentsBlockedMessage,
}: StudentPaymentsEntryProps) {
  if (paymentsBlockedMessage) {
    const blockedBody = (
      <>
        <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>
        <div
          className="mt-10 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-6 py-12 text-center shadow-[var(--shadow-card)]"
          role="status"
        >
          <p className="text-base text-[var(--color-foreground)]">{paymentsBlockedMessage}</p>
        </div>
      </>
    );
    return (
      <SurfaceMountGate
        skeleton={<StudentPaymentsSkeleton />}
        desktop={<div>{blockedBody}</div>}
        narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
          <PwaPageShell surface={surface}>
            <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
              <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{blockedBody}</div>
            </div>
          </PwaPageShell>
        )}
      />
    );
  }

  const body = (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>
      {hasPromotionApplied ? <PromotionAppliedBadge label={labels.promoBadge} /> : null}
      <PromotionApplyForm
        locale={locale}
        studentId={studentId}
        labels={{
          promoTitle: labels.promoTitle,
          promoLead: labels.promoLead,
          promoPlaceholder: labels.promoPlaceholder,
          promoApply: labels.promoApply,
          promoSuccess: labels.promoSuccess,
          promoError: labels.promoError,
        }}
      />
      <StudentPaymentForm labels={labels} />
      <h2 className="mt-10 font-display text-xl font-semibold text-[var(--color-primary)]">
        {labels.paymentsHistory}
      </h2>
      <StudentPaymentsHistory rows={payments} labels={labels} />
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<StudentPaymentsSkeleton />}
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
