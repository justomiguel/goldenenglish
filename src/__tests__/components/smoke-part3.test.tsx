import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/hooks/useLogin", () => ({
  useLogin: () => ({
    email: "",
    password: "",
    rememberMe: false,
    error: null,
    redirecting: false,
    isLoading: false,
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setRememberMe: vi.fn(),
    handleSubmit: vi.fn(),
  }),
}));

vi.mock("@/app/[locale]/dashboard/admin/import/actions", () => ({
  bulkImportStudentsFromRows: vi.fn().mockResolvedValue({
    processed: 0,
    createdUsers: 0,
    enrolled: 0,
    paymentsSeeded: 0,
    profilesUpdated: 0,
    skippedNoop: 0,
    results: [],
  }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/actions", () => ({
  createDashboardUser: vi.fn().mockResolvedValue({ ok: true, userId: "u1" }),
}));

vi.mock("@/app/[locale]/dashboard/admin/settings/actions", () => ({
  setInscriptionsEnabled: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/app/[locale]/dashboard/admin/payments/actions", () => ({
  reviewPayment: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("recharts", () => {
  const Box = ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart">{children}</div>
  );
  return {
    ResponsiveContainer: Box,
    BarChart: Box,
    Bar: () => null,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  };
});

import { AdminDashboardShell } from "@/components/dashboard/AdminDashboardShell";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";
import { AdminMobileDrawer } from "@/components/dashboard/AdminMobileDrawer";
import { AdminBreadcrumb } from "@/components/dashboard/AdminBreadcrumb";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";
import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";
import { ImportStudents } from "@/components/organisms/ImportStudents";
import { RegisterForm } from "@/components/register/RegisterForm";
import { AttendancePlayboard } from "@/components/student/AttendancePlayboard";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";

describe("component smoke — dashboard & forms", () => {
  it("AdminDashboardShell", () => {
    render(
      <AdminDashboardShell
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        newRegistrationsCount={0}
        adminProfileRole="admin"
        teacherPortalAllowed={false}
      >
        <div>page</div>
      </AdminDashboardShell>,
    );
  });

  it("AdminChromeHeader", () => {
    render(
      <AdminChromeHeader
        locale="es"
        brand={mockBrandPublic}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: dictEn.nav.logout }),
    ).toBeInTheDocument();
  });

  it("AdminChromeHeader uses English tagline when locale en", () => {
    render(
      <AdminChromeHeader
        locale="en"
        brand={mockBrandPublic}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed={false}
      />,
    );
  });

  it("AdminChromeHeader links to teacher dashboard when teacher portal is allowed", () => {
    render(
      <AdminChromeHeader
        locale="es"
        brand={mockBrandPublic}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed
      />,
    );
    const teacherLinks = screen.getAllByRole("link", {
      name: dictEn.dashboard.adminChrome.openTeacherDashboardAria,
    });
    expect(teacherLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("AdminSidebar", () => {
    render(
      <AdminSidebar
        locale="es"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={1}
      />,
    );
  });

  it("AdminSidebarNavContent shows dual-role hint when teacherNav is set", () => {
    render(
      <AdminSidebarNavContent
        locale="es"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={3}
        teacherNav={{
          href: "/es/dashboard/teacher",
          hint: dictEn.dashboard.adminChrome.dualRoleNavHint,
          cta: dictEn.dashboard.adminChrome.openTeacherDashboard,
          ctaAria: dictEn.dashboard.adminChrome.openTeacherDashboardAria,
          switchHint: dictEn.dashboard.adminNav.workspaceSwitchHint,
        }}
      />,
    );
    expect(screen.getByText(dictEn.dashboard.adminChrome.dualRoleNavHint)).toBeInTheDocument();
  });

  it("AdminSidebarNavContent", () => {
    render(
      <AdminSidebarNavContent
        locale="es"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={3}
      />,
    );
    expect(screen.getByText(dictEn.dashboard.adminNav.groupPeople)).toBeInTheDocument();
  });

  it("AdminMobileDrawer", () => {
    render(
      <AdminMobileDrawer
        locale="es"
        dict={dictEn}
        newRegistrationsCount={0}
      />,
    );
    expect(
      screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }),
    ).toBeInTheDocument();
  });

  it("AdminBreadcrumb hides on admin home", () => {
    const { container } = render(
      <AdminBreadcrumb locale="es" dict={dictEn.dashboard.adminNav} />,
    );
    expect(container.querySelector("nav")).toBeNull();
  });

  it("AdminCreateUserForm", () => {
    render(<AdminCreateUserForm locale="en" labels={dictEn.admin.users} />);
  });

  it("InscriptionsSettingsForm", () => {
    render(
      <InscriptionsSettingsForm
        locale="es"
        initialEnabled
        labels={dictEn.admin.settings}
      />,
    );
  });

  it("PaymentReviewRow", () => {
    render(
      <PaymentReviewRow
        locale="en"
        paymentId="00000000-0000-4000-8000-000000000099"
        studentLabel="Student"
        periodLabel="1/2025"
        amountLabel="$10"
        previewUrl={null}
        labels={dictEn.admin.payments}
        emptyValue={dictEn.common.emptyValue}
      />,
    );
  });

  it("ImportStudents", () => {
    render(
      <ImportStudents
        locale="en"
        labels={dictEn.admin.import}
        emptyLogPlaceholder={dictEn.common.emptyValue}
      />,
    );
  });

  it("RegisterForm", () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={[
          { id: "00000000-0000-4000-8000-000000000001", label: "Test" },
        ]}
      />,
    );
  });

  it("RegisterSuccessDialog", () => {
    render(
      <RegisterSuccessDialog
        locale="es"
        open
        onOpenChange={vi.fn()}
        dict={dictEn.register}
      />,
    );
  });

  it("AttendancePlayboard", () => {
    render(
      <AttendancePlayboard rows={[]} labels={dictEn.dashboard.student} />,
    );
  });
});
