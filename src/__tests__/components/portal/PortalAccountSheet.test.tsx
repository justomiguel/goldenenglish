import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockPathname } from "@/test/navigationMock";
import { dictEn } from "@/test/dictEn";
import type { PortalAccountItem } from "@/lib/portal/portalShellTypes";

const mockInstall = vi.fn();
const mockInstallPrompt = vi.fn(() => ({
  visible: false,
  iosHint: false,
  busy: false,
  deferred: null,
  installable: false,
  dismiss: vi.fn(),
  install: mockInstall,
}));

vi.mock("@/hooks/usePwaInstallPrompt", () => ({
  usePwaInstallPrompt: () => mockInstallPrompt(),
}));

import { PortalAccountSheet } from "@/components/portal/PortalAccountSheet";

const ITEMS: PortalAccountItem[] = [
  { id: "profile", label: "My profile", href: "/en/dashboard/profile" },
  { id: "childDetails", label: "Student details", meta: "Mateo", href: "/en/dashboard/parent/children/s1" },
  { id: "language", label: "Language", action: "language" },
  { id: "installApp", label: "Install the app", action: "installApp" },
  { id: "signOut", label: "Sign out", action: "signOut" },
];

function renderSheet() {
  return render(
    <PortalAccountSheet
      locale="en"
      items={ITEMS}
      heading="Account"
      openLabel="Open account menu"
      closeLabel="Close"
      localeLabels={dictEn.common.locale}
    />,
  );
}

describe("PortalAccountSheet", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/en/dashboard/parent");
    mockInstall.mockClear();
    mockInstallPrompt.mockReturnValue({
      visible: false,
      iosHint: false,
      busy: false,
      deferred: null,
      installable: false,
      dismiss: vi.fn(),
      install: mockInstall,
    });
  });

  function makeInstallable() {
    mockInstallPrompt.mockReturnValue({
      visible: true,
      iosHint: false,
      busy: false,
      deferred: null,
      installable: true,
      dismiss: vi.fn(),
      install: mockInstall,
    });
  }

  it("starts closed and exposes only the trigger", () => {
    renderSheet();
    expect(screen.getByRole("button", { name: "Open account menu" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal dialog labelled with the heading", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    const dialog = screen.getByRole("dialog", { name: "Account" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("lists profile and child details as links, with the child name as meta", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.getByRole("link", { name: /My profile/ })).toHaveAttribute(
      "href",
      "/en/dashboard/profile",
    );
    expect(screen.getByRole("link", { name: /Student details/ })).toHaveTextContent("Mateo");
  });

  it("reveals the locale links only after opening the language row", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.queryByRole("navigation", { name: dictEn.common.locale.label })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Language" }));
    const nav = screen.getByRole("navigation", { name: dictEn.common.locale.label });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(dictEn.common.locale.es) })).toHaveAttribute(
      "href",
      "/es/dashboard/parent",
    );
  });

  it("offers sign out inside the sheet", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSheet();
    const trigger = screen.getByRole("button", { name: "Open account menu" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("hides the install item when the app cannot be installed", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.queryByRole("button", { name: "Install the app" })).not.toBeInTheDocument();
  });

  it("offers the install item and triggers the prompt when installable", async () => {
    makeInstallable();
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.click(screen.getByRole("button", { name: "Install the app" }));
    expect(mockInstall).toHaveBeenCalled();
  });

  it("keeps Tab inside the open sheet", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    const dialog = screen.getByRole("dialog", { name: "Account" });
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("closes when a destination inside the sheet is chosen", async () => {
    // jsdom cannot navigate; swallow the anchor default so the assertion is about the sheet.
    const swallow = (event: Event) => event.preventDefault();
    document.addEventListener("click", swallow, true);
    try {
      const user = userEvent.setup();
      renderSheet();
      await user.click(screen.getByRole("button", { name: "Open account menu" }));
      await user.click(screen.getByRole("link", { name: /My profile/ }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally {
      document.removeEventListener("click", swallow, true);
    }
  });
});
