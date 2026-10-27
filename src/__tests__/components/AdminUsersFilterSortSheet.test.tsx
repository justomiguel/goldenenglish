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
  age: { all: 1, unknown: 1, "0-2": 0, "3-5": 0, "6-8": 0, "9-12": 0, "13-17": 0, "18+": 0 },
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

  it("shows the filter title and closes on apply", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AdminUsersFilterSortSheet open onOpenChange={onOpenChange} labels={labels} />,
    );

    expect(screen.getByRole("heading", { name: labels.mobileFilterTitle })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: labels.sortPanelTitle })).not.toBeInTheDocument();
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
