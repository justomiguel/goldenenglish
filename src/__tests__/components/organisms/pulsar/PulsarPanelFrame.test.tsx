import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { mockPathname } from "@/test/navigationMock";

vi.mock("@/app/[locale]/admin/sessionActions", () => ({
  signOutPulsarSessionAction: vi.fn(),
}));

import { PulsarPanelFrame } from "@/components/organisms/pulsar/PulsarPanelFrame";

const dict = es as unknown as Dictionary;

function desktopMedia() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function narrowMedia() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("max-width"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("PulsarPanelFrame", () => {
  beforeEach(() => {
    desktopMedia();
    mockPathname.mockReturnValue("/es/admin");
  });

  it("shows the staff tools in the rail and leaves public pages out", () => {
    mockPathname.mockReturnValue("/es/admin");
    render(
      <PulsarPanelFrame locale="es" dict={dict} email="staff@centrolisto.cl" role="staff">
        <p>fleet</p>
      </PulsarPanelFrame>,
    );
    expect(screen.getByRole("link", { name: dict.pulsar.admin.tabSites })).toHaveAttribute(
      "href",
      "/es/admin?tab=sites",
    );
    expect(screen.getByRole("link", { name: dict.pulsar.admin.tabSites })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: dict.pulsar.admin.tabMail })).toHaveAttribute(
      "href",
      "/es/admin?tab=mail",
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.pricing })).toBeNull();
    expect(screen.queryByRole("link", { name: dict.pulsar.solutionSet.presencia.navLabel })).toBeNull();
    expect(screen.getByText("staff@centrolisto.cl")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.pulsar.session.signOut })).toBeInTheDocument();
  });

  it("opens the same links from the menu on a narrow surface", async () => {
    narrowMedia();
    const user = userEvent.setup();
    render(
      <PulsarPanelFrame locale="es" dict={dict} email="owner@school.test" role="owner">
        <p>sites</p>
      </PulsarPanelFrame>,
    );
    await user.click(screen.getByRole("button", { name: dict.pulsar.panelNav.openMenu }));
    expect(screen.getByRole("link", { name: dict.pulsar.account.homeTitle })).toHaveAttribute(
      "href",
      "/es/cuenta",
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.pricing })).toBeNull();
  });
});
