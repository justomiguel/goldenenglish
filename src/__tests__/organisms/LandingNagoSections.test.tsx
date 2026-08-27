import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingNagoSections } from "@/components/organisms/LandingNagoSections";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("LandingNagoSections", () => {
  it("applies type-C lockup and Ken Burns layers on the hero", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("nago-hero-title");
    expect(title.closest(".nago-type-c")).toBeTruthy();
    expect(container.querySelector(".nago-hero-ken")).toBeTruthy();
    expect(container.querySelector('img[src*="hero-chile.png"]')).toBeTruthy();
    expect(container.querySelector(".nago-offer-ken")).toBeTruthy();
  });

  it("renders the footer logo without a cream plate", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    const footerLogo = container.querySelector("footer img");
    expect(footerLogo).toBeTruthy();
    expect(footerLogo?.parentElement?.className ?? "").not.toMatch(/nago-heading-solid/);
  });
});
