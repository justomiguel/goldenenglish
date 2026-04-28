"use client";

import { useId, useState } from "react";
import { GraduationCap, History, Receipt } from "lucide-react";
import { AdminEnrollmentFeeExemption } from "@/components/dashboard/AdminEnrollmentFeeExemption";
import { AdminStudentBillingPaymentsTable } from "@/components/dashboard/AdminStudentBillingPaymentsTable";
import { AdminStudentBillingScholarshipPanel } from "@/components/dashboard/AdminStudentBillingScholarshipPanel";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];
type BillingTabId = "history" | "scholarships" | "enrollment";

export interface AdminStudentBillingTabsPanelProps {
  locale: Locale;
  studentId: string;
  labels: BillingLabels;
  selectedBenefit: AdminStudentBillingSectionBenefit | null;
  visiblePayments: AdminBillingPaymentRow[];
  selectedScholarships: AdminBillingScholarship[];
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
}

export function AdminStudentBillingTabsPanel({
  locale,
  studentId,
  labels,
  selectedBenefit,
  visiblePayments,
  selectedScholarships,
  enrollmentFeeExempt,
  enrollmentExemptReason,
  lastEnrollmentPaidAt,
}: AdminStudentBillingTabsPanelProps) {
  const [active, setActive] = useState<BillingTabId>("history");
  const idPrefix = useId().replace(/:/g, "");

  const items: readonly UnderlineTabItem[] = [
    { id: "history", label: labels.tabHistory, Icon: History },
    { id: "scholarships", label: labels.tabScholarships, Icon: GraduationCap },
    { id: "enrollment", label: labels.tabEnrollment, Icon: Receipt },
  ];

  const sectionId = selectedBenefit?.sectionId ?? null;
  const sectionName = selectedBenefit?.sectionName ?? null;

  return (
    <section className="space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.billingTabsReadOnlyHint}</p>
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={labels.tabsAria}
        items={items}
        value={active}
        onChange={(id) => setActive(id as BillingTabId)}
      />

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "history")}
        aria-labelledby={underlineTabId(idPrefix, "history")}
        hidden={active !== "history"}
        className="pt-2"
      >
        {active === "history" ? (
          visiblePayments.length === 0 ? (
            <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4 text-sm text-[var(--color-muted-foreground)]">
              {labels.tabHistoryEmpty}
            </p>
          ) : (
            <AdminStudentBillingPaymentsTable
              payments={visiblePayments}
              scholarships={selectedScholarships}
              labels={labels}
              busy={false}
              readOnly
            />
          )
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "scholarships")}
        aria-labelledby={underlineTabId(idPrefix, "scholarships")}
        hidden={active !== "scholarships"}
        className="pt-2"
      >
        {active === "scholarships" ? (
          <AdminStudentBillingScholarshipPanel
            key={`scholarship-${sectionId ?? "global"}`}
            locale={locale}
            studentId={studentId}
            sectionId={sectionId}
            sectionName={sectionName}
            scholarships={selectedScholarships}
            labels={labels}
            busy={false}
            setBusy={() => {}}
            setMsg={() => {}}
            readOnly
          />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={underlinePanelId(idPrefix, "enrollment")}
        aria-labelledby={underlineTabId(idPrefix, "enrollment")}
        hidden={active !== "enrollment"}
        className="pt-2"
      >
        {active === "enrollment" ? (
          <AdminEnrollmentFeeExemption
            key={`enrollment-${sectionId ?? "global"}`}
            locale={locale}
            studentId={studentId}
            enrollmentId={selectedBenefit?.enrollmentId ?? null}
            sectionId={sectionId}
            sectionName={sectionName}
            labels={labels}
            initialExempt={
              selectedBenefit ? selectedBenefit.enrollmentFeeExempt : enrollmentFeeExempt
            }
            initialReason={
              selectedBenefit
                ? selectedBenefit.enrollmentExemptReason
                : enrollmentExemptReason
            }
            initialLastPaidAt={
              selectedBenefit
                ? selectedBenefit.lastEnrollmentPaidAt
                : lastEnrollmentPaidAt
            }
            receiptSignedUrl={selectedBenefit?.enrollmentFeeReceiptSignedUrl ?? null}
            receiptStatus={selectedBenefit?.enrollmentFeeReceiptStatus ?? null}
            readOnly
          />
        ) : null}
      </div>
    </section>
  );
}
