// REGRESSION CHECK: academic content planning must be discoverable from Admin > Academic.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";

describe("AdminSidebar contents navigation", () => {
  it("shows Contents under the admin academic navigation", () => {
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
});
