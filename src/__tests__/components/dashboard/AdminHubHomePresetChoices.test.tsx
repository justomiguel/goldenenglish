import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminHubHomePresetChoices } from "@/components/dashboard/AdminHubHomePresetChoices";
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

describe("AdminHubHomePresetChoices", () => {
  beforeEach(() => {
    installDialog();
  });

  it("keeps the layouts behind a button and shows sizes inside the popup", () => {
    render(
      <AdminHubHomePresetChoices
        labels={dictEn.admin.home.layout}
        dict={dictEn}
        draft={factoryAdminHomeLayout({ shopEnabled: true })}
        visibility={VISIBILITY}
        onApply={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /Back to the start/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.home.layout.presetsTitle }));
    const operations = screen.getByRole("button", { name: /Operations/ });
    expect(operations.textContent).toContain(dictEn.admin.home.summary.payments.title);
    expect(operations.querySelector(".col-span-8")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Back to the start/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("applies the People layout", () => {
    const onApply = vi.fn();
    render(
      <AdminHubHomePresetChoices
        labels={dictEn.admin.home.layout}
        dict={dictEn}
        draft={factoryAdminHomeLayout({ shopEnabled: true })}
        visibility={VISIBILITY}
        onApply={onApply}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.home.layout.presetsTitle }));
    fireEvent.click(screen.getByRole("button", { name: /People/ }));
    expect(onApply).toHaveBeenCalledWith("people");
  });
});
