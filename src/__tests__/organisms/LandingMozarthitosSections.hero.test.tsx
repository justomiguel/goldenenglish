import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class {
      constructor(_cb: IntersectionObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  }
});

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    sizes,
    className,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      data-priority={priority ? "true" : "false"}
    />
  ),
}));

vi.mock("@/components/organisms/LandingMozarthitosLowerSections", () => ({
  LandingMozarthitosLowerSections: () => <div data-testid="mz-lower" />,
}));
vi.mock("@/components/organisms/MozarthitosBioTabs", () => ({
  MozarthitosBioTabs: () => null,
}));

import { LandingMozarthitosSections } from "@/components/organisms/LandingMozarthitosSections";

const dict = dictEs as Dictionary;

describe("LandingMozarthitosSections hero LCP", () => {
  it("paints the banner as a priority img, not CSS background", () => {
    const { container } = render(
      <LandingMozarthitosSections dict={dict} locale="es" />,
    );
    const surface = container.querySelector(".mz-hero-surface") as HTMLElement;
    expect(surface.style.backgroundImage).toBe("");
    const banner = container.querySelector(
      'img[src="/images/mozarthitos/inicio/banner.jpg"]',
    );
    expect(banner).toBeTruthy();
    expect(banner).toHaveAttribute("data-priority", "true");
    const portrait = container.querySelector(
      'img[src="/images/mozarthitos/inicio/2.png"]',
    );
    expect(portrait).toBeTruthy();
    expect(portrait).not.toHaveAttribute("data-priority", "true");
  });

  it("opens the family guide from the secondary CTA and keeps register first", () => {
    render(<LandingMozarthitosSections dict={dict} locale="es" />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/es/register");
    expect(links[0]).toHaveAccessibleName(dict.landing.hero.ctaReserveSpot);
    const guide = screen.getByRole("link", { name: "Encuentra su clase" });
    expect(guide).toHaveAttribute("href", "/es/encuentra-tu-clase");
    expect(screen.queryByRole("link", { name: "Conoce la academia" })).toBeNull();
    expect(links.some((link) => link.getAttribute("href")?.includes("#quienes"))).toBe(false);
  });
});
