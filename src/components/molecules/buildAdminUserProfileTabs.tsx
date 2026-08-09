import type { ReactNode } from "react";
import { CreditCard, GraduationCap, HeartPulse, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminUserProfileTabId } from "@/components/molecules/AdminUserProfileTabButton";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

type UserLabels = Dictionary["admin"]["users"];

export type AdminUserProfileTabConfig = {
  id: AdminUserProfileTabId;
  label: string;
  icon: ReactNode;
  badge?: string | number | null;
  disabled?: boolean;
  title?: string;
  tourId?: string;
};

export function buildAdminUserProfileTabs(input: {
  labels: UserLabels;
  detail: AdminUserDetailVM;
  pendingPayments: number;
  paymentsDisabled: boolean;
  academicNeedsAttention: boolean;
}): AdminUserProfileTabConfig[] {
  const { labels, detail, pendingPayments, paymentsDisabled, academicNeedsAttention } = input;
  const tabs: AdminUserProfileTabConfig[] = [
    {
      id: "summary",
      label: labels.detailTabSummary,
      icon: <UserRound className="h-4 w-4" aria-hidden />,
      tourId: ADMIN_TOUR_ANCHORS.userDetailTabSummary,
    },
    {
      id: "academic",
      label: labels.detailTabAcademic,
      icon: <GraduationCap className="h-4 w-4" aria-hidden />,
      badge: academicNeedsAttention ? "!" : null,
      tourId: ADMIN_TOUR_ANCHORS.userDetailTabAcademic,
    },
  ];

  if (detail.role === "student") {
    tabs.push(
      {
        id: "payments",
        label: labels.detailTabPayments,
        icon: <CreditCard className="h-4 w-4" aria-hidden />,
        badge: paymentsDisabled ? "!" : pendingPayments > 0 ? pendingPayments : null,
        disabled: paymentsDisabled,
        title: paymentsDisabled ? labels.detailPaymentsDisabledNoSection : undefined,
        tourId: ADMIN_TOUR_ANCHORS.userDetailTabPayments,
      },
      {
        id: "family",
        label: labels.detailTabFamily,
        icon: <UsersRound className="h-4 w-4" aria-hidden />,
        badge: detail.tutorLinks.length > 0 ? detail.tutorLinks.length : null,
        tourId: ADMIN_TOUR_ANCHORS.userDetailTabFamily,
      },
      {
        id: "care",
        label: labels.detailTabCare,
        icon: <HeartPulse className="h-4 w-4" aria-hidden />,
        badge: detail.hasCareNotes ? "!" : null,
      },
    );
  }

  if (detail.role === "parent") {
    tabs.push({
      id: "family",
      label: labels.detailTabFamily,
      icon: <UsersRound className="h-4 w-4" aria-hidden />,
      badge:
        detail.tutorLinkedStudents.length > 0 ? detail.tutorLinkedStudents.length : null,
      tourId: ADMIN_TOUR_ANCHORS.userDetailTabFamily,
    });
  }

  tabs.push({
    id: "security",
    label: labels.detailTabSecurity,
    icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
    tourId: ADMIN_TOUR_ANCHORS.userDetailSecurityTab,
  });

  return tabs;
}
