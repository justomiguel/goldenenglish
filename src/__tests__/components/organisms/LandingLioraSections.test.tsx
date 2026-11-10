import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LIORA_CLASS_KEYS, LIORA_SEDE_KEYS } from "@/lib/landing/lioraSchedule";

vi.mock("@/components/organisms/LioraLandingGallery", () => ({
  LioraLandingGallery: () => <section data-testid="liora-gallery" />,
}));

vi.mock("@/components/organisms/LioraLandingContactPanel", () => ({
  LioraLandingContactPanel: () => <section data-testid="liora-contact-panel" />,
}));

vi.mock("@/components/organisms/LandingLioraFooter", () => ({
  LandingLioraFooter: () => <footer data-testid="liora-footer" />,
}));

import { LandingLioraSections } from "@/components/organisms/LandingLioraSections";

const dict = dictEs as Dictionary;
const t = (path: string) => marketingLandingCopy(dict, "liora", path);

const defaultProps = {
  dict,
  brand: { ...mockBrandPublic, logoPath: "/images/liora/logo/logo.png" },
  locale: "es",
};

describe("LandingLioraSections", () => {
  it("renders the hero with the studio headline and both CTAs", () => {
    render(<LandingLioraSections {...defaultProps} publicCtaMode="both" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: `${t("hero.title")} ${t("hero.titleScript")}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dict.landing.hero.ctaReserveSpot }),
    ).toHaveAttribute("href", "/es/register");
    expect(
      screen.getByRole("link", { name: dict.landing.hero.ctaTrialClass }),
    ).toHaveAttribute("href", "/es/register?intent=trial");
    expect(
      screen.getByRole("link", { name: t("hero.ctaSecondary") }),
    ).toHaveAttribute("href", "/es#horarios");
  });

  it("renders one card per ballet level and per sede", () => {
    render(<LandingLioraSections {...defaultProps} />);

    for (const key of LIORA_CLASS_KEYS) {
      expect(
        screen.getByRole("heading", { name: t(`clases.${key}.title`) }),
      ).toBeInTheDocument();
    }
    for (const sedeKey of LIORA_SEDE_KEYS) {
      expect(
        screen.getAllByRole("heading", { name: t(`sedes.${sedeKey}.name`) }).length,
      ).toBeGreaterThan(0);
      expect(screen.getByText(t(`sedes.${sedeKey}.metro`))).toBeInTheDocument();
    }
  });

  it("falls back to the bundled hero photo when no media override exists", () => {
    const { container } = render(<LandingLioraSections {...defaultProps} />);
    const hero = container.querySelector(".liora-hero") as HTMLElement;
    expect(hero.style.backgroundImage).toBe("");
    expect(
      container.querySelector('img[src="/images/liora/inicio/1.jpg"]'),
    ).toBeTruthy();
  });

  it("uses the CMS override for the hero background when present", () => {
    const override = "https://cdn.example.com/liora/hero.jpg";
    const { container } = render(
      <LandingLioraSections
        {...defaultProps}
        mediaMap={new Map([["inicio::1", override]])}
      />,
    );
    const hero = container.querySelector(".liora-hero") as HTMLElement;
    expect(hero.style.backgroundImage).toBe("");
    expect(container.querySelector(`img[src="${override}"]`)).toBeTruthy();
  });

  it("delegates gallery, contact panel and footer to their own organisms", () => {
    render(<LandingLioraSections {...defaultProps} />);

    expect(screen.getByTestId("liora-gallery")).toBeInTheDocument();
    expect(screen.getByTestId("liora-contact-panel")).toBeInTheDocument();
    expect(screen.getByTestId("liora-footer")).toBeInTheDocument();
  });

  describe("narrow screens (below md)", () => {
    const tokens = (el: Element | null) => (el?.getAttribute("class") ?? "").split(/\s+/);

    it("drops the duplicate hero logo and keeps one primary button", () => {
      const { container } = render(<LandingLioraSections {...defaultProps} publicCtaMode="both" />);
      const hero = container.querySelector(".liora-hero");
      expect(tokens(hero?.querySelector('img[src="/images/liora/logo/logo.png"]') ?? null)).toEqual(
        expect.arrayContaining(["hidden", "md:block"]),
      );
      const reserve = screen.getByRole("link", { name: dict.landing.hero.ctaReserveSpot });
      const trial = screen.getByRole("link", { name: dict.landing.hero.ctaTrialClass });
      expect(tokens(reserve)).toContain("liora-btn-solid");
      expect(tokens(trial)).toContain("liora-btn-alt");
      expect(tokens(screen.getByRole("link", { name: t("hero.ctaSecondary") }))).toEqual(
        expect.arrayContaining(["hidden", "md:inline-flex"]),
      );
    });

    it("lets the install sheet wait until the hero leaves the screen", () => {
      const { container } = render(<LandingLioraSections {...defaultProps} />);
      expect(container.querySelector(".liora-hero")).toHaveAttribute("data-pwa-install-defer");
    });

    it("renders the inline event slot right after the hero", () => {
      const { container } = render(<LandingLioraSections {...defaultProps} />);
      const slot = container.querySelector("#home-event-inline-slot");
      expect(slot).not.toBeNull();
      expect(slot?.previousElementSibling?.classList.contains("liora-hero")).toBe(true);
    });

    it("turns the classes into a swipe list with snap", () => {
      render(<LandingLioraSections {...defaultProps} />);
      const list = screen.getByRole("list", { name: t("clases.sectionTitle") });
      expect(tokens(list)).toEqual(expect.arrayContaining(["overflow-x-auto", "snap-x", "snap-mandatory"]));
      expect(list.querySelectorAll(":scope > li")).toHaveLength(LIORA_CLASS_KEYS.length);
    });

    it("hides the sede flyer images", () => {
      const { container } = render(<LandingLioraSections {...defaultProps} />);
      const images = container.querySelectorAll("#sedes img");
      expect(images.length).toBe(LIORA_SEDE_KEYS.length);
      images.forEach((img) => expect(tokens(img)).toEqual(expect.arrayContaining(["hidden", "md:block"])));
    });
  });
});
