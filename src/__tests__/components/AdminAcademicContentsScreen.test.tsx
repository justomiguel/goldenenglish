import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminAcademicContentsScreen } from "@/components/admin/AdminAcademicContentsScreen";
import { dictEn } from "@/test/dictEn";

const refresh = vi.fn();
const deleteLearningRouteAction = vi.fn(async () => ({ ok: true, id: "00000000-0000-4000-8000-000000000099" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/actions", () => ({
  deleteLearningRouteAction: (...args: unknown[]) => deleteLearningRouteAction(...args),
}));

describe("AdminAcademicContentsScreen", () => {
  it("shows repository tab with search and global-new CTA", () => {
    render(
      <AdminAcademicContentsScreen
        locale="en"
        activeTab="repository"
        routes={[]}
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
        routes={[{
          id: "00000000-0000-4000-8000-000000000099",
          title: "A1 Foundation Route",
          description: "First units",
        }]}
        globalContents={[]}
        repositoryPagination={{ page: 1, pageSize: 20, totalCount: 0, searchQuery: "" }}
        labels={dictEn.dashboard.adminContents}
      />,
    );

    expect(screen.getByRole("tab", { name: new RegExp(dictEn.dashboard.adminContents.learningRoutesTitle, "i") })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: new RegExp(dictEn.dashboard.adminContents.newLearningRouteOption, "i") })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/sections/new/edit",
    );
    expect(screen.getAllByRole("link", { name: /A1 Foundation Route/i })[0]).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/sections/00000000-0000-4000-8000-000000000099/edit",
    );
    expect(screen.getByRole("link", { name: /edit learning route: A1 Foundation Route/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete learning route permanently: A1 Foundation Route/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /A1 - Morning/i })).not.toBeInTheDocument();
  });

  it("confirms before permanently deleting a learning route", async () => {
    const user = userEvent.setup();
    render(
      <AdminAcademicContentsScreen
        locale="en"
        activeTab="routes"
        routes={[{
          id: "00000000-0000-4000-8000-000000000099",
          title: "A1 Foundation Route",
          description: "First units",
        }]}
        globalContents={[]}
        repositoryPagination={{ page: 1, pageSize: 20, totalCount: 0, searchQuery: "" }}
        labels={dictEn.dashboard.adminContents}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete learning route permanently: A1 Foundation Route/i }));
    expect(screen.getByRole("dialog", { name: dictEn.dashboard.adminContents.deleteLearningRouteTitle })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminContents.delete }));

    await waitFor(() => {
      expect(deleteLearningRouteAction).toHaveBeenCalledWith({
        locale: "en",
        routeId: "00000000-0000-4000-8000-000000000099",
      });
    });
  });
});
