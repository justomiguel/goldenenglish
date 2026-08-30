import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingNagoSections } from "@/components/organisms/LandingNagoSections";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitPublicContactForm: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("LandingNagoSections", () => {
  it("applies the editorial hero lockup and Ken Burns layers", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("nago-hero-title");
    expect(title.closest(".nago-hero-lockup")).toBeTruthy();
    expect(container.querySelector(".nago-hero-ken")).toBeTruthy();
    expect(container.querySelector('img[src*="nago-hero-roda.png"]')).toBeTruthy();
    expect(title.textContent).toMatch(/transform/i);
  });

  it("renders the five Nagô pillars and program cards", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    expect(screen.getByRole("heading", { name: dictEn.landing.nago.pilares.deporte.title })).toBeTruthy();
    expect(screen.getByRole("heading", { name: dictEn.landing.nago.programas.sectionTitle })).toBeTruthy();
    expect(container.querySelectorAll(".nago-program-card-bar")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: dictEn.landing.nago.mestre.title })).toBeTruthy();
  });

  it("points public WhatsApp contact to the Ñuñoa number", () => {
    render(<LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />);
    const wa = screen.getAllByRole("link", { name: dictEn.landing.nago.chrome.whatsappAria });
    expect(wa.length).toBeGreaterThan(0);
    for (const link of wa) {
      expect(link).toHaveAttribute("href", "https://wa.me/56990639071");
    }
  });

  it("renders the footer logo without a cream plate", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    const footerLogo = container.querySelector("footer img");
    expect(footerLogo).toBeTruthy();
    expect(footerLogo).toHaveAttribute("src", "/images/nago/logo/logo.png");
    expect(footerLogo?.parentElement?.className ?? "").not.toMatch(/nago-heading-solid/);
  });
});
