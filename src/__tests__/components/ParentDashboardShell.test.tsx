import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { mockPathname } from "@/test/navigationMock";
import { ParentDashboardShell } from "@/components/dashboard/ParentDashboardShell";
import { buildParentSidebarNavGroups } from "@/components/dashboard/parentSidebarNavGroups";
import { resolveParentPwaTab } from "@/components/pwa/molecules/ParentPwaTabBar";

describe("ParentDashboardShell", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/es/dashboard/parent");
  });

  it("renders simplified desktop nav links for the family portal", () => {
    render(
      <ParentDashboardShell locale="es" dict={dictEn} brand={mockBrandPublic}>
        <p>Family content</p>
      </ParentDashboardShell>,
    );

    expect(screen.getByText("Family content")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: dictEn.dashboard.parentNav.aria }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dictEn.dashboard.parentNav.progress })).toHaveAttribute(
      "href",
      "/es/dashboard/parent/progress",
    );
    expect(
      screen.queryByRole("link", { name: dictEn.dashboard.parentNav.tasks }),
    ).not.toBeInTheDocument();
  });
});

describe("buildParentSidebarNavGroups", () => {
  it("exposes five primary destinations plus settings and profile", () => {
    const groups = buildParentSidebarNavGroups(
      "/en/dashboard/parent",
      "/en/dashboard/profile",
      dictEn.dashboard.parentNav,
    );
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toEqual([
      "/en/dashboard/parent",
      "/en/dashboard/parent/calendar",
      "/en/dashboard/parent/progress",
      "/en/dashboard/parent/payments",
      "/en/dashboard/parent/messages",
      "/en/dashboard/parent/settings",
      "/en/dashboard/profile",
    ]);
  });
});

describe("resolveParentPwaTab", () => {
  it("maps legacy child routes to the progress tab", () => {
    const base = "/es/dashboard/parent";
    expect(resolveParentPwaTab(`${base}/tasks`, base)).toBe("progress");
    expect(resolveParentPwaTab(`${base}/billing`, base)).toBe("payments");
  });

  it("maps settings route to the settings tab", () => {
    const base = "/es/dashboard/parent";
    expect(resolveParentPwaTab(`${base}/settings`, base)).toBe("settings");
  });
});
