"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { StudentPaymentForm } from "@/components/student/StudentPaymentForm";
import {
  StudentPaymentsHistory,
  type StudentPaymentRow,
} from "@/components/student/StudentPaymentsHistory";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";

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
  title: string;
  lead: string;
  payments: StudentPaymentRow[];
  labels: StudentLabels;
}

export function StudentPaymentsEntry({ title, lead, payments, labels }: StudentPaymentsEntryProps) {
  const body = (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>
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
