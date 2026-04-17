import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { TeacherDashboardShell } from "@/components/dashboard/TeacherDashboardShell";

describe("TeacherDashboardShell", () => {
  it("renders chrome, sidebar nav labels, and children", () => {
    render(
      <TeacherDashboardShell locale="es" dict={dictEn} brand={mockBrandPublic}>
        <p>Main content</p>
      </TeacherDashboardShell>,
    );
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: dictEn.dashboard.teacherNav.aria })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dictEn.dashboard.teacherNav.home })).toHaveAttribute(
      "href",
      "/es/dashboard/teacher",
    );
    expect(screen.getByRole("banner", { name: dictEn.dashboard.teacherChrome.ariaHeader })).toBeInTheDocument();
  });

  it("shows admin workspace link when adminNav is passed", () => {
    render(
      <TeacherDashboardShell
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        adminNav={{
          href: "/es/dashboard/admin",
          hint: dictEn.dashboard.teacherChrome.dualRoleAdminNavHint,
          cta: dictEn.dashboard.teacherChrome.openAdminDashboard,
          ctaAria: dictEn.dashboard.teacherChrome.openAdminDashboardAria,
          switchHint: dictEn.dashboard.teacherNav.workspaceSwitchHint,
        }}
      >
        <p>Content</p>
      </TeacherDashboardShell>,
    );
    expect(
      screen.getAllByRole("link", { name: dictEn.dashboard.teacherChrome.openAdminDashboardAria }).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
