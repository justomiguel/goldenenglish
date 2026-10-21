import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersMobileToolbar } from "@/components/pwa/molecules/AdminUsersMobileToolbar";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.users;

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

describe("AdminUsersMobileToolbar", () => {
  beforeEach(() => {
    installDialog();
  });

  it("keeps the users toolbar tour anchor and exports the list", async () => {
    const user = userEvent.setup();
    const onExportUsers = vi.fn();
    const { container } = render(
      <AdminUsersMobileToolbar
        labels={labels}
        query=""
        onQueryChange={() => {}}
        totalCount={4}
        sortKey="email"
        sortDir="asc"
        onToggleSort={() => {}}
        allVisibleSelected={false}
        onToggleSelectAllVisible={() => {}}
        selectAllDisabled={false}
        onExportUsers={onExportUsers}
      />,
    );

    expect(container.querySelector(`[data-tour="${ADMIN_TOUR_ANCHORS.usersToolbar}"]`)).not.toBeNull();
    expect(screen.getByText(labels.countTotal.replace("{{count}}", "4"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.exportUsers }));
    expect(onExportUsers).toHaveBeenCalledOnce();
  });

  it("flushes search on submit and opens the sort sheet", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onToggleSort = vi.fn();
    render(
      <AdminUsersMobileToolbar
        labels={labels}
        query=""
        onQueryChange={onQueryChange}
        totalCount={1}
        sortKey="email"
        sortDir="asc"
        onToggleSort={onToggleSort}
        allVisibleSelected={false}
        onToggleSelectAllVisible={() => {}}
        selectAllDisabled={false}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: labels.filterLabel }), "ana");
    await user.keyboard("{Enter}");
    expect(onQueryChange).toHaveBeenCalledWith("ana");

    await user.click(screen.getByRole("button", { name: /Sort:/ }));
    await user.click(screen.getByRole("button", { name: labels.colName }));
    expect(onToggleSort).toHaveBeenCalledWith("name");
  });
});
