import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { AdminRegistrationCreateButton } from "@/components/dashboard/AdminRegistrationCreateButton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/registrations",
}));

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration: vi.fn(),
}));

vi.mock("@/app/[locale]/i/actions", () => ({
  submitSectionLinkRegistration: vi.fn(),
}));

vi.mock("@/app/[locale]/register/lookupRegistrationStudentAction", () => ({
  lookupRegistrationStudentAction: vi.fn(),
}));

const baseProps = {
  locale: "en",
  labels: en.admin.registrations,
  registerDict: en.register,
  legalAgeMajority: 18,
  sectionOptions: [{ id: "00000000-0000-4000-8000-000000000001", label: "Morning" }],
};

describe("AdminRegistrationCreateButton", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
  });

  it("opens the public registration fields for this institute", async () => {
    const user = userEvent.setup();
    render(<AdminRegistrationCreateButton {...baseProps} extrasPack={null} />);

    await user.click(screen.getByRole("button", { name: en.admin.registrations.createCta }));

    expect(screen.getByLabelText(/First name/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.register.continue })).toBeInTheDocument();
    expect(document.querySelector("[data-extras-pack]")?.getAttribute("data-extras-pack")).toBe("none");
    expect(screen.queryByLabelText(en.register.nagoPack.nationality)).not.toBeInTheDocument();
  });

  it("keeps the institute extras pack on the same form", async () => {
    const user = userEvent.setup();
    render(<AdminRegistrationCreateButton {...baseProps} extrasPack="nago" />);

    await user.click(screen.getByRole("button", { name: en.admin.registrations.createCta }));

    expect(document.querySelector("[data-extras-pack]")?.getAttribute("data-extras-pack")).toBe("nago");
  });
});
