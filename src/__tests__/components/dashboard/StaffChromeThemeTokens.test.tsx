import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar";
import { StaffWorkspaceSwitch } from "@/components/dashboard/StaffWorkspaceSwitch";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/admin",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/dashboard/viewAsActions", () => ({
  clearViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/admin" })),
  openOwnTeacherAction: vi.fn(async () => ({ href: "/en/dashboard/teacher" })),
  searchViewAsPeopleAction: vi.fn(async () => ({ rows: [] })),
  startViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/student", started: true })),
}));

const SUMMARY: AdminHubSummary = {
  traffic: { totalHits: 1, authenticatedHits: 1, guestHits: 0 },
  trafficDaily: [],
  trafficWeekOverWeek: { thisWeek: 1, lastWeek: 1 },
  users: { total: 1, byRole: [] },
  payments: { pendingCount: 0 },
  registrations: { newCount: 0, totalCount: 0 },
  studentsWithoutSection: 0,
  messages: { recentCount: 0, latestPreview: null },
};

describe("staff chrome uses tenant primary tokens", () => {
  it("admin rail is a light workplace panel, not the accent", () => {
    const { container } = render(
      <AdminSidebar
        locale="en"
        dict={dictEn.dashboard.adminNav}
        fullDict={dictEn}
        brand={mockBrandPublic}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
        profileDisplayName="Ada"
        profileRoleLabel="Admin"
        profileAvatarUrl={null}
      />,
    );
    const rail = container.querySelector("aside");
    expect(rail?.className).toContain("--color-background");
    expect(rail?.className).not.toContain("--color-secondary");
    const logo = container.querySelector("img");
    expect(logo?.className).toContain("h-32");
    expect(logo?.className).toContain("w-32");
    const name = [...container.querySelectorAll("span")].find(
      (el) => el.textContent === "Test Institute",
    );
    expect(name?.className).toContain("text-3xl");
    expect(name?.className).not.toContain("text-2xl");
    const motto = [...container.querySelectorAll("span")].find(
      (el) => el.textContent === "Tagline EN",
    );
    expect(motto?.className).toContain("text-xs");
    const signOut = [...container.querySelectorAll("button")].find((el) =>
      el.textContent?.includes(dictEn.nav.logout),
    );
    const signOutIcon = signOut?.querySelector("svg");
    expect(signOutIcon).toBeTruthy();
    expect(signOutIcon?.getAttribute("class")).toContain("h-6");
    expect(signOutIcon?.getAttribute("class")).toContain("w-6");
    expect(container.querySelector("[data-tour='admin-sidebar-boost']")).toBeNull();
  });

  it("teacher rail is a light workplace panel, not the accent", () => {
    const { container } = render(
      <TeacherSidebar
        locale="en"
        dict={dictEn.dashboard.teacherNav}
        fullDict={dictEn}
        brand={mockBrandPublic}
        profileDisplayName="Ada"
        profileRoleLabel="Teacher"
        profileAvatarUrl={null}
      />,
    );
    const rail = container.querySelector("aside");
    expect(rail?.className).toContain("--color-background");
    expect(rail?.className).not.toContain("--color-secondary");
  });

  it("workspace switch active pill uses primary", () => {
    const { container } = render(
      <StaffWorkspaceSwitch locale="en" dict={dictEn} activeRole="admin" viewAs={null} />,
    );
    const trigger = container.querySelector("button");
    expect(trigger?.className).toContain("--color-primary");
    expect(trigger?.className).not.toContain("--color-secondary");
  });

  it("Impulsa strip uses secondary with foreground contrast", () => {
    const { container } = render(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
      />,
    );
    const boost = container.querySelector('[data-tour="admin-hub-boost"]');
    expect(boost?.className).toContain("--color-secondary");
    expect(boost?.className).toContain("--color-secondary-foreground");
    expect(boost?.className).not.toContain("--color-primary");
  });

});
