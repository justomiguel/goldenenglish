import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";

const navState = vi.hoisted(() => ({
  pathname: "/es/dashboard/admin",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
}));

// REGRESSION CHECK: navigating from an academic cohort/section into Finance
// must preserve the cohort id, otherwise the hub may default to another
// cohort and render an apparently empty "Vista cohorte".
describe("AdminSidebarNavContent finance link", () => {
  it("preserves the academic cohort context when linking to Finance", () => {
    const cohortId = "82f70fa1-a723-4406-bc61-42278abba648";
    navState.pathname = `/es/dashboard/admin/academic/${cohortId}/bf4a5125-d6c0-4595-bd15-1b343ddbfdb5`;

    render(
      <AdminSidebarNavContent
        locale="es"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
      />,
    );

    expect(
      screen.getByRole("link", { name: dictEn.dashboard.adminNav.finance }),
    ).toHaveAttribute(
      "href",
      `/es/dashboard/admin/finance?tab=overview&cohort=${cohortId}`,
    );
  });

  it("keeps the plain Finance link outside academic cohort routes", () => {
    navState.pathname = "/es/dashboard/admin/users";

    render(
      <AdminSidebarNavContent
        locale="es"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={0}
      />,
    );

    expect(
      screen.getByRole("link", { name: dictEn.dashboard.adminNav.finance }),
    ).toHaveAttribute("href", "/es/dashboard/admin/finance");
  });
});
