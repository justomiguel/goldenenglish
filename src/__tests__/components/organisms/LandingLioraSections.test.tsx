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
    render(<LandingLioraSections {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 1, name: t("hero.title") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t("hero.ctaPrimary") })).toHaveAttribute(
      "href",
      "/es/register",
    );
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
    expect(hero.style.backgroundImage).toContain("/images/liora/inicio/1.jpg");
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
    expect(hero.style.backgroundImage).toContain(override);
  });

  it("delegates gallery, contact panel and footer to their own organisms", () => {
    render(<LandingLioraSections {...defaultProps} />);

    expect(screen.getByTestId("liora-gallery")).toBeInTheDocument();
    expect(screen.getByTestId("liora-contact-panel")).toBeInTheDocument();
    expect(screen.getByTestId("liora-footer")).toBeInTheDocument();
  });
});
