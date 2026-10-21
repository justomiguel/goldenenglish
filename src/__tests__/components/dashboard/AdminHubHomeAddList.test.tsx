import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminHubHomeAddList } from "@/components/dashboard/AdminHubHomeAddList";
import { factoryAdminHomeLayout } from "@/lib/dashboard/adminHomeLayout";
import { dictEn } from "@/test/dictEn";

const VISIBILITY = {
  shopEnabled: true,
  checklistDone: true,
  studentsWithoutSection: 0,
  hasCurrentCohort: true,
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

describe("AdminHubHomeAddList", () => {
  beforeEach(() => {
    installDialog();
  });

  it("opens a checklist and describes each card", () => {
    render(
      <AdminHubHomeAddList
        labels={dictEn.admin.home.layout}
        dict={dictEn}
        draft={factoryAdminHomeLayout({ shopEnabled: true })}
        visibility={VISIBILITY}
        onShow={() => undefined}
        onHide={() => undefined}
      />,
    );
    expect(screen.queryByRole("checkbox", { name: /Payments/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.home.layout.addTitle }));
    expect(screen.getByRole("checkbox", { name: /Payments/ })).toBeChecked();
    expect(screen.getByText(dictEn.admin.home.layout.widgets.about.payments)).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: /Ready for the first class/ })).toBeNull();
  });

  it("shows a card when checked and hides it when cleared", () => {
    const onShow = vi.fn();
    const onHide = vi.fn();
    const draft = factoryAdminHomeLayout({ shopEnabled: true });
    draft.items = draft.items.map((item) => (item.id === "payments" ? { ...item, hidden: true } : item));
    render(
      <AdminHubHomeAddList
        labels={dictEn.admin.home.layout}
        dict={dictEn}
        draft={draft}
        visibility={VISIBILITY}
        onShow={onShow}
        onHide={onHide}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.home.layout.addTitle }));
    const payments = screen.getByRole("checkbox", { name: /Payments/ });
    expect(payments).not.toBeChecked();
    fireEvent.click(payments);
    expect(onShow).toHaveBeenCalledWith("payments");

    fireEvent.click(screen.getByRole("checkbox", { name: /Registrations/ }));
    expect(onHide).toHaveBeenCalledWith("registrations");
  });
});
