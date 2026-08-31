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
    expect(container.querySelector(".nago-scroll-root")).toBeTruthy();
    expect(container.querySelector(".nago-scroll-progress")).toBeTruthy();
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

  it("shows reserve and trial class buttons when both CTAs are provided", () => {
    render(
      <LandingNagoSections
        dict={dictEn}
        brand={mockBrandPublic}
        locale="es"
        registerCtas={[
          { href: "/es/register", label: dictEn.landing.nago.hero.ctaReserve, intent: "reserve" },
          {
            href: "/es/register?intent=trial",
            label: dictEn.landing.nago.hero.ctaTrial,
            intent: "trial",
          },
        ]}
      />,
    );
    const reserve = screen.getAllByRole("link", { name: dictEn.landing.nago.hero.ctaReserve });
    const trial = screen.getAllByRole("link", { name: dictEn.landing.nago.hero.ctaTrial });
    expect(reserve.length).toBeGreaterThanOrEqual(2);
    expect(trial.length).toBeGreaterThanOrEqual(2);
    expect(reserve[0]).toHaveAttribute("href", "/es/register");
    expect(trial[0]).toHaveAttribute("href", "/es/register?intent=trial");
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

  it("masks major section titles", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    const masks = container.querySelectorAll(".nago-reveal-mask");
    expect(masks.length).toBeGreaterThanOrEqual(8);
    expect(
      screen.getByRole("heading", { name: dictEn.landing.nago.programas.sectionTitle })
        .closest(".nago-reveal-mask"),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: dictEn.landing.nago.galeria.sectionTitle })
        .closest(".nago-reveal-mask"),
    ).toBeTruthy();
  });

  it("pins the mestre photo below the header", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    expect(container.querySelector(".nago-mestre-pin")).toBeTruthy();
  });

  it("reveals footer columns and the lead form", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    const footerReveals = container.querySelectorAll("footer .nago-reveal");
    expect(footerReveals.length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector(".nago-lead")?.closest(".nago-reveal")).toBeTruthy();
  });
});
