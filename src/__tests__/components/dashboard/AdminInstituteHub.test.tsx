import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { buildAdminInstituteHubGroups } from "@/lib/dashboard/buildAdminInstituteHubGroups";
import { AdminInstituteHub } from "@/components/dashboard/AdminInstituteHub";

describe("AdminInstituteHub", () => {
  it("renders the four groups and omits blog by default", () => {
    const groups = buildAdminInstituteHubGroups("/en/dashboard/admin", dictEn.dashboard.adminNav, {});
    render(
      <AdminInstituteHub
        title={dictEn.dashboard.adminNav.institute}
        lead={dictEn.dashboard.adminNav.tipInstitute}
        groups={groups}
      />,
    );
    expect(screen.getByRole("heading", { name: dictEn.dashboard.adminNav.instituteHub.academic })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dictEn.dashboard.adminNav.instituteHub.growth })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminNav.blog })).toBeNull();
    expect(screen.getByRole("link", { name: /All accounts/ })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/users",
    );
  });
});
