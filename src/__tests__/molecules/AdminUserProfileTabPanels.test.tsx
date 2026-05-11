import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AdminUserAcademicPanel,
  AdminUserSummaryPanel,
} from "@/components/molecules/AdminUserProfileTabPanels";
import { dictEn } from "@/test/dictEn";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";

// REGRESSION CHECK: Birth date / age belong on Summary tab for every profile role, not Academic.

vi.mock("@/components/molecules/AdminUserInlineEditableField", () => ({
  AdminUserInlineEditableField: ({ field, label }: { field: string; label: string }) => (
    <div data-testid={`inline-${field}`}>{label}</div>
  ),
}));

vi.mock("@/components/molecules/AdminStudentCurrentCohortAssignmentCard", () => ({
  AdminStudentCurrentCohortAssignmentCard: () => null,
}));

vi.mock("@/components/molecules/AdminUserHomeAddressField", () => ({
  AdminUserHomeAddressField: () => <div data-testid="home-address-stub" />,
}));

const baseVm = (): AdminUserDetailVM => ({
  userId: "00000000-0000-4000-8000-000000000099",
  email: "t@example.com",
  emailDisplay: "t@example.com",
  firstName: "Pat",
  lastName: "Lee",
  role: "teacher",
  phone: "",
  phoneDisplay: "—",
  dniOrPassport: "",
  homeAddressText: "",
  homePlaceId: null,
  birthDateIso: "1990-05-01",
  birthDateDisplay: "1990-05-01",
  ageYears: 35,
  isMinor: false,
  assignedTeacherName: null,
  createdAtDisplay: "—",
  avatarDisplayUrl: null,
  tutorLinks: [],
  tutorLinkedStudents: [],
  tutorFamilyScholarshipSections: [],
  currentCohortAssignment: null,
  familyHomeAddressPeerIds: [],
  viewerMayInlineEdit: false,
});

describe("AdminUserProfileTabPanels", () => {
  it("renders birth date and age on Summary panel", () => {
    render(
      <AdminUserSummaryPanel
        locale="en"
        detail={baseVm()}
        labels={dictEn.admin.users}
        editable={false}
        onFeedback={() => {}}
      />,
    );

    expect(screen.getByTestId("inline-birthDate")).toHaveTextContent(dictEn.admin.users.detailFieldBirth);
    expect(screen.getByText(dictEn.admin.users.detailFieldAge)).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
  });

  it("does not render birth date or age on Academic panel", () => {
    render(
      <AdminUserAcademicPanel
        locale="en"
        detail={baseVm()}
        labels={dictEn.admin.users}
        editable={false}
        roleLabel={dictEn.admin.users.roleOptionTeacher}
        roleOptions={[{ value: "teacher", label: dictEn.admin.users.roleOptionTeacher }]}
        onFeedback={() => {}}
      />,
    );

    expect(screen.queryByTestId("inline-birthDate")).not.toBeInTheDocument();
    expect(screen.queryByText(dictEn.admin.users.detailFieldAge)).not.toBeInTheDocument();
  });
});
