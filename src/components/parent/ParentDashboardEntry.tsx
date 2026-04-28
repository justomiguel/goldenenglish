"use client";

import Link from "next/link";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { DashboardGreetingHero } from "@/components/molecules/DashboardGreetingHero";
import { ParentDashboardFamilyView } from "@/components/parent/ParentDashboardFamilyView";
import { ParentHubMonthBillingCard } from "@/components/parent/ParentHubMonthBillingCard";
import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHubModel } from "@/types/parentHub";
import type { ParentLearningTaskRow } from "@/types/learningTasks";
import type { ParentLearningFeedbackRow } from "@/lib/learning-content/loadParentLearningFeedback";
import type { ParentMonthBillingSummary } from "@/lib/parent/loadParentMonthBillingInvoiceSummary";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

function ParentDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-32 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
      <div className="h-32 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface ParentDashboardEntryProps {
  locale: string;
  title: string;
  lead: string;
  kicker: string;
  greeting: string;
  fullDateLine: string;
  firstName: string | null;
  navPay: string;
  payHref: string;
  kids: { id: string; first_name: string; last_name: string }[];
  summaries?: ParentChildSummary[];
  selectedStudentId?: string;
  parentLabels: Dictionary["dashboard"]["parent"];
  hub?: ParentHubModel | null;
  learningTasks?: ParentLearningTaskRow[];
  learningFeedback?: ParentLearningFeedbackRow[];
  monthBillingSummary?: ParentMonthBillingSummary | null;
}

export function ParentDashboardEntry({
  locale,
  lead,
  kicker,
  greeting,
  fullDateLine,
  firstName,
  navPay,
  payHref,
  kids,
  summaries,
  selectedStudentId,
  parentLabels,
  hub = null,
  learningTasks = [],
  learningFeedback = [],
  monthBillingSummary = null,
}: ParentDashboardEntryProps) {
  const body = (
    <div className="space-y-6">
      <DashboardGreetingHero
        kicker={kicker}
        greeting={greeting}
        firstName={firstName}
        fullDateLine={fullDateLine}
        lead={lead}
      />
      {monthBillingSummary ? (
        <ParentHubMonthBillingCard
          locale={locale}
          summary={monthBillingSummary}
          dict={parentLabels.monthBilling}
        />
      ) : null}
      {summaries && summaries.length > 0 ? (
        <ParentDashboardFamilyView
          locale={locale}
          summaries={summaries}
          selectedStudentId={selectedStudentId}
          navPay={navPay}
          payHrefBase={payHref}
          labels={parentLabels}
          hub={hub}
          learningTasks={learningTasks}
          learningFeedback={learningFeedback}
        />
      ) : (
        <ul className="space-y-3">
          {kids.map((k) => (
            <li key={k.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-soft)]">
                <span className="font-medium text-[var(--color-foreground)]">
                  {formatProfileNameSurnameFirst(k.first_name, k.last_name)}
                </span>
                <Link
                  href={payHref}
                  className="text-sm font-semibold text-[var(--color-primary)] underline"
                >
                  {navPay}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {kids.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      ) : null}
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<ParentDashboardSkeleton />}
      desktop={<div>{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
