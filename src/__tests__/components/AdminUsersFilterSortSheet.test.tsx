import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersFilterSortSheet } from "@/components/pwa/molecules/AdminUsersFilterSortSheet";
import { dictEn } from "@/test/dictEn";
import type { AdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";

const labels = dictEn.admin.users;
const binary = { all: 1, with: 0, without: 1 };
const facets: AdminDirectoryFacets = {
  section: {},
  sectionAll: 1,
  access: { all: 1, never: 1, entered: 0 },
  phone: binary,
  created: { all: 1, last30: 0, older: 1 },
  enrollment: binary,
  teachingRole: { all: 1, lead: 0, assistant: 1 },
  parentLink: binary,
  scholarship: binary,
  due: binary,
  monthlyStatus: { all: 1, current: 0, behind: 1, na: 0 },
  email: { all: 1, deliverable: 1, none: 0 },
  children: binary,
};

function installDialog() {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.show = function show() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
}

describe("AdminUsersFilterSortSheet", () => {
  beforeEach(() => {
    installDialog();
  });

  it("changes sort field and direction, then closes on apply", async () => {
    const user = userEvent.setup();
    const onToggleSort = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AdminUsersFilterSortSheet
        open
        onOpenChange={onOpenChange}
        labels={labels}
        sortKeys={["email", "name"]}
        sortKey="email"
        sortDir="asc"
        onToggleSort={onToggleSort}
      />,
    );

    expect(screen.getByRole("heading", { name: labels.mobileFilterSortTitle })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.mobileSortDesc }));
    expect(onToggleSort).toHaveBeenCalledWith("email");
    await user.click(screen.getByRole("button", { name: labels.colName }));
    expect(onToggleSort).toHaveBeenCalledWith("name");
    await user.click(screen.getByRole("button", { name: labels.mobileApplyFilters }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears directory filters from the sheet", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <AdminUsersFilterSortSheet
        open
        onOpenChange={() => {}}
        labels={labels}
        sortKeys={["name"]}
        sortKey="name"
        sortDir="desc"
        onToggleSort={() => {}}
        directoryFilters={{
          role: "student",
          labels: dictEn.admin.directoryFilters,
          values: { section: "sec-1" },
          facets,
          sectionOptions: [{ id: "sec-1", name: "A1" }],
          onChange: () => {},
          onClear,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: labels.mobileClearSelection }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
