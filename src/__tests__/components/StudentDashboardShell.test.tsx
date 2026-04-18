import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { mockPathname } from "@/test/navigationMock";
import { StudentDashboardShell } from "@/components/dashboard/StudentDashboardShell";

describe("StudentDashboardShell", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/es/dashboard/student");
  });

  // REGRESSION CHECK: The student dashboard chrome must keep header + sidebar nav + children
  // because layout.tsx delegates all UI to this shell after the auth/role guard.
  it("renders chrome, sidebar nav labels, and children", () => {
    render(
      <StudentDashboardShell locale="es" dict={dictEn} brand={mockBrandPublic}>
        <p>Main content</p>
      </StudentDashboardShell>,
    );
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: dictEn.dashboard.studentNav.aria }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dictEn.dashboard.studentNav.home }),
    ).toHaveAttribute("href", "/es/dashboard/student");
    expect(
      screen.getByRole("banner", { name: dictEn.dashboard.studentChrome.ariaHeader }),
    ).toBeInTheDocument();
  });

  it("links every primary section to its student route and profile to the shared profile page", () => {
    render(
      <StudentDashboardShell locale="en" dict={dictEn} brand={mockBrandPublic}>
        <span />
      </StudentDashboardShell>,
    );

    const expected: [string, string][] = [
      [dictEn.dashboard.studentNav.calendar, "/en/dashboard/student/calendar"],
      [dictEn.dashboard.studentNav.payments, "/en/dashboard/student/payments"],
      [dictEn.dashboard.studentNav.billing, "/en/dashboard/student/billing"],
      [dictEn.dashboard.studentNav.messages, "/en/dashboard/student/messages"],
      [dictEn.dashboard.studentNav.myProfile, "/en/dashboard/profile"],
    ];

    for (const [label, href] of expected) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("shows the student breadcrumb when the user is in a sub-route", () => {
    mockPathname.mockReturnValue("/es/dashboard/student/payments");
    render(
      <StudentDashboardShell locale="es" dict={dictEn} brand={mockBrandPublic}>
        <p />
      </StudentDashboardShell>,
    );
    const breadcrumbNav = screen.getByRole("navigation", {
      name: dictEn.dashboard.studentNav.breadcrumbNavAria,
    });
    expect(breadcrumbNav).toBeInTheDocument();
    expect(
      within(breadcrumbNav).getByRole("link", { name: dictEn.dashboard.studentNav.breadcrumbStudent }),
    ).toHaveAttribute("href", "/es/dashboard/student");
    expect(within(breadcrumbNav).getByText(dictEn.dashboard.studentNav.breadcrumbPayments)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
