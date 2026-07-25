"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminUserIdentityHero } from "@/components/molecules/AdminUserIdentityHero";
import {
  AdminUserProfileTabButton,
  type AdminUserProfileTabId,
} from "@/components/molecules/AdminUserProfileTabButton";
import {
  AdminUserAcademicPanel,
  AdminUserFamilyPanel,
  AdminUserPaymentsPanel,
  AdminUserSecurityPanel,
  AdminUserSummaryPanel,
} from "@/components/molecules/AdminUserProfileTabPanels";
import { buildAdminUserProfileTabs } from "@/components/molecules/buildAdminUserProfileTabs";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import {
  ADMIN_TOUR_ANCHORS,
  ADMIN_TUTORIAL_ACTIVATE_SECURITY_TAB_EVENT,
} from "@/lib/admin-tutorials/selectors";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];
type TabId = AdminUserProfileTabId;

export interface AdminUserProfileFichaProps {
  locale: Locale;
  labels: UserLabels;
  billingLabels: BillingLabels;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData | null;
  fileUploadProgress: FileUploadProgressLabels;
}

export function AdminUserProfileFicha({
  locale,
  labels,
  billingLabels,
  detail,
  billing,
  fileUploadProgress,
}: AdminUserProfileFichaProps) {
  const editable = detail.viewerMayInlineEdit;
  const displayName =
    formatProfileNameSurnameFirst(detail.firstName, detail.lastName) || detail.emailDisplay;
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");

  const onFeedback = useCallback((text: string, ok: boolean) => {
    setToast({ text, ok });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const onSecurity = () => setActiveTab("security");
    window.addEventListener(ADMIN_TUTORIAL_ACTIVATE_SECURITY_TAB_EVENT, onSecurity);
    return () =>
      window.removeEventListener(ADMIN_TUTORIAL_ACTIVATE_SECURITY_TAB_EVENT, onSecurity);
  }, []);

  const roleOptions = useMemo(
    () => [
      { value: "admin", label: labels.roleOptionAdmin },
      { value: "teacher", label: labels.roleOptionTeacher },
      { value: "student", label: labels.roleOptionStudent },
      { value: "parent", label: labels.roleOptionParent },
      { value: "assistant", label: labels.roleOptionAssistant },
    ],
    [labels],
  );
  const roleLabel = roleOptions.find((option) => option.value === detail.role)?.label ?? detail.role;
  const pendingPayments =
    billing?.payments.filter((payment) => payment.status === "pending").length ?? 0;
  const paymentsDisabled =
    detail.role === "student" && !detail.currentCohortAssignment?.current;
  const tabs = buildAdminUserProfileTabs({
    labels,
    detail,
    pendingPayments,
    paymentsDisabled,
    academicNeedsAttention: detail.role === "student" && paymentsDisabled,
  });
  const visibleActiveTab =
    activeTab === "payments" && paymentsDisabled ? "academic" : activeTab;

  const panel = (() => {
    if (visibleActiveTab === "summary") {
      return (
        <AdminUserSummaryPanel
          locale={locale}
          detail={detail}
          labels={labels}
          editable={editable}
          onFeedback={onFeedback}
        />
      );
    }
    if (visibleActiveTab === "academic") {
      return (
        <AdminUserAcademicPanel
          locale={locale}
          detail={detail}
          labels={labels}
          editable={editable}
          roleLabel={roleLabel}
          roleOptions={roleOptions}
          onFeedback={onFeedback}
        />
      );
    }
    if (visibleActiveTab === "payments" && billing) {
      return (
        <AdminUserPaymentsPanel
          locale={locale}
          detail={detail}
          billing={billing}
          billingLabels={billingLabels}
          studentName={displayName}
        />
      );
    }
    if (visibleActiveTab === "family") {
      return (
        <AdminUserFamilyPanel
          locale={locale}
          detail={detail}
          labels={labels}
          billingLabels={billingLabels}
          editable={editable}
          onFeedback={onFeedback}
        />
      );
    }
    return (
      <AdminUserSecurityPanel
        locale={locale}
        detail={detail}
        labels={labels}
        editable={editable}
        onFeedback={onFeedback}
      />
    );
  })();

  return (
    <div className="space-y-5">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-[var(--layout-border-radius)] border px-4 py-3 text-sm ${
            toast.ok
              ? "border-[var(--color-primary)]/40 bg-[var(--color-muted)]/40 text-[var(--color-foreground)]"
              : "border-[var(--color-error)]/50 bg-[var(--color-muted)]/30 text-[var(--color-error)]"
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      <AdminUserIdentityHero
        locale={locale}
        detail={detail}
        labels={labels}
        fileUploadProgress={fileUploadProgress}
        displayName={displayName}
        roleLabel={roleLabel}
      />

      <section className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div
          role="tablist"
          aria-label={labels.detailTitle}
          className="overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-muted)]/25"
          data-tour={ADMIN_TOUR_ANCHORS.userDetailTabs}
        >
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <AdminUserProfileTabButton
                key={tab.id}
                active={visibleActiveTab === tab.id}
                badge={tab.badge}
                disabled={tab.disabled}
                icon={tab.icon}
                onClick={() => setActiveTab(tab.id)}
                tabId={tab.id}
                title={tab.title}
                tourId={tab.tourId}
              >
                {tab.label}
              </AdminUserProfileTabButton>
            ))}
          </div>
        </div>
        <div
          id="student-dossier-panel"
          role="tabpanel"
          aria-labelledby={`student-dossier-tab-${visibleActiveTab}`}
          className="bg-[var(--color-background)] p-4 sm:p-5"
          data-tour={
            visibleActiveTab === "security"
              ? ADMIN_TOUR_ANCHORS.userDetailSecurityPanel
              : ADMIN_TOUR_ANCHORS.userDetailWorkspace
          }
        >
          {panel}
        </div>
      </section>
    </div>
  );
}
