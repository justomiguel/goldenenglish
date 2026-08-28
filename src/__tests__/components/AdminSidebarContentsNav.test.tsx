// Contents now lives in Instituto, not the daily academic list.
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
  it("does not list Contents on the daily rail", () => {
    render(
      <AdminSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );

    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminNav.contents })).toBeNull();
    expect(screen.getByRole("link", { name: dictEn.dashboard.adminNav.institute })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/institute",
    );
  });

  it("lists Events always and Blog when includeBlogNav", () => {
    const { rerender } = render(
      <AdminSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.adminNav.events })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/events",
    );
    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminNav.blog })).toBeNull();

    rerender(
      <AdminSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
        includeBlogNav
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.adminNav.blog })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/cms/blog",
    );
  });
});
