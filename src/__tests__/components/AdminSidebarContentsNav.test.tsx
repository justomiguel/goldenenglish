// REGRESSION CHECK: academic content planning must be discoverable from Admin > Academic.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";

const navState = vi.hoisted(() => ({
  pathname: "/en/dashboard/admin/academic/contents",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
}));

describe("AdminSidebar contents navigation", () => {
  it("shows Contents under the admin academic navigation", () => {
    navState.pathname = "/en/dashboard/admin/academic/contents";
    render(
      <AdminSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
      />,
    );

    expect(screen.getByRole("link", { name: dictEn.dashboard.adminNav.contents })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents",
    );
  });

  it("does not mark Hub académico active when only Contents subtree matches", () => {
    navState.pathname = "/en/dashboard/admin/academic/contents/global/new";
    render(
      <AdminSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
      />,
    );

    const academics = screen.getByRole("link", { name: dictEn.dashboard.adminNav.academics });
    const contents = screen.getByRole("link", { name: dictEn.dashboard.adminNav.contents });
    expect(academics.className).not.toContain("border-[var(--color-primary)]");
    expect(contents.className).toContain("border-[var(--color-primary)]");
  });
});
