import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminAcademicContentsScreen } from "@/components/admin/AdminAcademicContentsScreen";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const section = {
  id: "00000000-0000-4000-8000-000000000001",
  label: "A1 - Morning",
  cohortName: "A1",
};

describe("AdminAcademicContentsScreen", () => {
  it("shows repository tab with search and global-new CTA", () => {
    render(
      <AdminAcademicContentsScreen
        locale="en"
        activeTab="repository"
        sections={[section]}
        globalContents={[]}
        repositoryPagination={{ page: 1, pageSize: 20, totalCount: 0, searchQuery: "" }}
        labels={dictEn.dashboard.adminContents}
      />,
    );

    expect(screen.getByRole("tablist", { name: dictEn.dashboard.adminContents.contentsTablistAria })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: new RegExp(dictEn.dashboard.adminContents.repositoryTitle, "i") })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByPlaceholderText(dictEn.dashboard.adminContents.repositorySearchPlaceholder)).toBeInTheDocument();
    expect(screen.queryByLabelText(dictEn.dashboard.adminContents.sectionLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: dictEn.dashboard.adminContents.globalNewPageCta })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/global/new",
    );
  });

  it("shows learning routes grid when routes tab is active", () => {
    render(
      <AdminAcademicContentsScreen
        locale="en"
        activeTab="routes"
        sections={[section]}
        globalContents={[]}
        repositoryPagination={{ page: 1, pageSize: 20, totalCount: 0, searchQuery: "" }}
        labels={dictEn.dashboard.adminContents}
      />,
    );

    expect(screen.getByRole("tab", { name: new RegExp(dictEn.dashboard.adminContents.learningRoutesTitle, "i") })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: new RegExp(dictEn.dashboard.adminContents.globalRouteOption, "i") })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/sections/global/edit",
    );
    expect(screen.getByRole("link", { name: /A1 - Morning/i })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/sections/00000000-0000-4000-8000-000000000001/edit",
    );
  });
});
