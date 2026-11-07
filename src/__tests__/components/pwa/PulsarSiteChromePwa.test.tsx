import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams(),
}));
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

vi.mock("@/app/[locale]/admin/sessionActions", () => ({
  signOutPulsarSessionAction: vi.fn(),
}));

import { PulsarSiteChromePwa } from "@/components/pwa/organisms/PulsarSiteChromePwa";

const dict = es as unknown as Dictionary;

describe("PulsarSiteChromePwa", () => {
  it("shows sign-out and the thumb link on a conversion page", () => {
    render(
      <PulsarSiteChromePwa locale="es" dict={dict} email="owner@school.test" activeNav="home">
        <p>page</p>
      </PulsarSiteChromePwa>,
    );
    expect(screen.getByRole("link", { name: dict.pulsar.nav.enterPanel })).toHaveAttribute(
      "href",
      "/es/cuenta",
    );
    expect(screen.getByRole("button", { name: dict.pulsar.session.signOut })).not.toHaveTextContent(
      dict.pulsar.session.signOut,
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.startFree })).toBeNull();
    expect(screen.getByRole("link", { name: dict.pulsar.nav.pricing })).toHaveAttribute(
      "href",
      "/es/precios",
    );
    expect(screen.getByRole("navigation", { name: dict.pulsar.session.navAria })).toBeInTheDocument();
    const home = screen.getByRole("link", { name: dict.pulsar.nav.home });
    expect(home).toHaveAttribute("aria-current", "page");
    expect(home).toHaveClass("bg-[var(--color-muted)]");
    expect(screen.getByRole("combobox", { name: dict.pulsar.market.label })).toHaveTextContent(dict.pulsar.market.cl);
    expect(screen.queryByRole("option", { name: dict.pulsar.market.py })).toBeNull();
  });

  it("shows sign-in and hides the thumb link on the conversation page", () => {
    render(
      <PulsarSiteChromePwa locale="es" dict={dict} email={null} activeNav="contact">
        <p>page</p>
      </PulsarSiteChromePwa>,
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.enterPanel })).toBeNull();
    expect(screen.getByRole("link", { name: dict.pulsar.session.signIn })).toHaveAttribute(
      "href",
      "/es/cuenta/login",
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.startFree })).toBeNull();
    const contact = screen.getByRole("link", { name: dict.pulsar.nav.contact });
    expect(contact).toHaveAttribute("aria-current", "page");
    expect(contact).toHaveClass("bg-[var(--color-muted)]");
    expect(screen.getByRole("link", { name: dict.pulsar.nav.home })).not.toHaveClass(
      "bg-[var(--color-muted)]",
    );
  });

  it("keeps the panel link in the top bar when the thumb is hidden", () => {
    render(
      <PulsarSiteChromePwa locale="es" dict={dict} email="owner@school.test" activeNav="contact">
        <p>page</p>
      </PulsarSiteChromePwa>,
    );
    expect(screen.getByRole("link", { name: dict.pulsar.nav.enterPanel })).toHaveAttribute(
      "href",
      "/es/cuenta",
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.startFree })).toBeNull();
    expect(screen.getByRole("button", { name: dict.pulsar.session.signOut })).toBeInTheDocument();
  });
});
