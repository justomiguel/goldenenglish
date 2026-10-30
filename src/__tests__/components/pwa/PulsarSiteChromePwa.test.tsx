import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    expect(screen.getByRole("link", { name: dict.pulsar.nav.admin })).toHaveAttribute(
      "href",
      "/es/admin",
    );
    expect(screen.getByRole("button", { name: dict.pulsar.session.signOut })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dict.pulsar.nav.cta })).toHaveAttribute(
      "href",
      "/es/contacto",
    );
    expect(screen.getByRole("navigation", { name: dict.pulsar.session.navAria })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dict.pulsar.nav.home })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows sign-in and hides the thumb link on the conversation page", () => {
    render(
      <PulsarSiteChromePwa locale="es" dict={dict} email={null} activeNav="contact">
        <p>page</p>
      </PulsarSiteChromePwa>,
    );
    expect(screen.getByRole("link", { name: dict.pulsar.session.signIn })).toHaveAttribute(
      "href",
      "/es/cuenta/login",
    );
    expect(screen.queryByRole("link", { name: dict.pulsar.nav.cta })).toBeNull();
  });
});
