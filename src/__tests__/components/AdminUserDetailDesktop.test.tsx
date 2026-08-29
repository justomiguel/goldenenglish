import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminUserDetailDesktop } from "@/components/desktop/organisms/AdminUserDetailDesktop";
import { dictEn } from "@/test/dictEn";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";

vi.mock("@/components/dashboard/AdminUserDetailPanel", () => ({
  AdminUserDetailPanel: () => <div>detail panel</div>,
}));

function detail(role: string): AdminUserDetailVM {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    email: "a@example.com",
    emailDisplay: "a@example.com",
    firstName: "Ana",
    lastName: "Perez",
    role,
    phone: "",
    phoneDisplay: "—",
    dniOrPassport: "",
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
    currentCohortAssignment: null,
    familyHomeAddressPeerIds: [],
    hasCareNotes: false,
    viewerMayInlineEdit: true,
  };
}

function renderDetail(role: string) {
  return render(
    <AdminUserDetailDesktop
      locale="es"
      labels={dictEn.admin.users}
      billingLabels={dictEn.admin.billing}
      detail={detail(role)}
      billing={null}
      fileUploadProgress={dictEn.common.fileUpload}
    />,
  );
}

describe("AdminUserDetailDesktop", () => {
  it("goes back to Alumnos from a student profile", () => {
    renderDetail("student");
    expect(screen.getByRole("link", { name: dictEn.admin.users.detailBack })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/students",
    );
  });

  it("goes back to Profesores from a teacher profile", () => {
    renderDetail("teacher");
    expect(screen.getByRole("link", { name: dictEn.admin.users.detailBack })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/teachers",
    );
  });

  it("goes back to Padres from a parent profile", () => {
    renderDetail("parent");
    expect(screen.getByRole("link", { name: dictEn.admin.users.detailBack })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/parents",
    );
  });
});
