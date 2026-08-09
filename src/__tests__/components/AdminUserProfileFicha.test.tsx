import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminUserProfileFicha } from "@/components/molecules/AdminUserProfileFicha";
import { dictEn } from "@/test/dictEn";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";

vi.mock("@/components/molecules/AdminUserIdentityHero", () => ({
  AdminUserIdentityHero: () => <div data-testid="identity-hero" />,
}));

vi.mock("@/components/molecules/AdminUserProfileTabPanels", () => ({
  AdminUserSummaryPanel: () => <div>Summary panel</div>,
  AdminUserAcademicPanel: () => <div>Academic panel</div>,
  AdminUserPaymentsPanel: () => <div>Payments panel</div>,
  AdminUserFamilyPanel: () => <div>Family panel</div>,
  AdminUserSecurityPanel: () => <div>Security panel</div>,
}));

vi.mock("@/components/molecules/AdminUserCarePanel", () => ({
  AdminUserCarePanel: () => <div>Care panel</div>,
}));

function makeStudentDetail(
  assigned: boolean,
): AdminUserDetailVM {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    email: "student@example.com",
    emailDisplay: "student@example.com",
    firstName: "Ana",
    lastName: "Student",
    role: "student",
    phone: "",
    phoneDisplay: "—",
    dniOrPassport: "DOC",
    homeAddressText: "",
    homePlaceId: null,
    birthDateIso: null,
    birthDateDisplay: null,
    ageYears: null,
    isMinor: false,
    assignedTeacherName: null,
    createdAtDisplay: "2026-01-01",
    avatarDisplayUrl: null,
    tutorLinks: [],
    tutorLinkedStudents: [],
    tutorFamilyScholarshipSections: [],
    currentCohortAssignment: {
      cohortId: "cohort-1",
      cohortName: "2026",
      sections: [],
      current: assigned
        ? {
            enrollmentId: "enr-1",
            sectionId: "sec-1",
            sectionName: "A1",
          }
        : null,
      hasMultipleCurrentAssignments: false,
    },
    familyHomeAddressPeerIds: [],
    hasCareNotes: false,
    viewerMayInlineEdit: true,
  };
}

function makeParentDetail(): AdminUserDetailVM {
  return {
    ...makeStudentDetail(false),
    userId: "00000000-0000-4000-8000-000000000002",
    role: "parent",
    currentCohortAssignment: null,
  };
}

const billing: AdminStudentBillingTabData = {
  payments: [],
  scholarships: [],
  sectionBenefits: [],
  enrollmentFeeExempt: false,
  enrollmentExemptReason: null,
  lastEnrollmentPaidAt: null,
};

describe("AdminUserProfileFicha", () => {
  it("disables payments tab until the student has a current section", () => {
    render(
      <AdminUserProfileFicha
        locale="en"
        labels={dictEn.admin.users}
        billingLabels={dictEn.admin.billing}
        detail={makeStudentDetail(false)}
        billing={billing}
      />,
    );

    const tab = screen.getByRole("tab", {
      name: new RegExp(dictEn.admin.users.detailTabPayments),
    });
    expect(tab).toBeDisabled();
    expect(tab).toHaveAttribute(
      "title",
      dictEn.admin.users.detailPaymentsDisabledNoSection,
    );
  });

  it("enables payments tab after section assignment exists", () => {
    render(
      <AdminUserProfileFicha
        locale="en"
        labels={dictEn.admin.users}
        billingLabels={dictEn.admin.billing}
        detail={makeStudentDetail(true)}
        billing={billing}
      />,
    );

    expect(
      screen.getByRole("tab", {
        name: dictEn.admin.users.detailTabPayments,
      }),
    ).toBeEnabled();
  });

  it("offers the care tab on a student file", () => {
    render(
      <AdminUserProfileFicha
        locale="en"
        labels={dictEn.admin.users}
        billingLabels={dictEn.admin.billing}
        detail={makeStudentDetail(true)}
        billing={billing}
      />,
    );

    expect(
      screen.getByRole("tab", { name: new RegExp(dictEn.admin.users.detailTabCare) }),
    ).toBeEnabled();
  });

  it("marks the care tab when the student has notes, without saying what they are", () => {
    render(
      <AdminUserProfileFicha
        locale="en"
        labels={dictEn.admin.users}
        billingLabels={dictEn.admin.billing}
        detail={{ ...makeStudentDetail(true), hasCareNotes: true }}
        billing={billing}
      />,
    );

    expect(
      screen.getByRole("tab", { name: `${dictEn.admin.users.detailTabCare} !` }),
    ).toBeInTheDocument();
  });

  it("does not offer the care tab on a guardian file", () => {
    // `family` renders for parents too, so the care tab has to be added inside
    // the student-only block or guardians get a tab about themselves.
    render(
      <AdminUserProfileFicha
        locale="en"
        labels={dictEn.admin.users}
        billingLabels={dictEn.admin.billing}
        detail={makeParentDetail()}
        billing={null}
      />,
    );

    expect(
      screen.queryByRole("tab", { name: new RegExp(dictEn.admin.users.detailTabCare) }),
    ).not.toBeInTheDocument();
  });
});
