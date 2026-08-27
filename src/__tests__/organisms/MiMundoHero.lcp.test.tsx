import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-priority={priority ? "true" : "false"} />
  ),
}));
vi.mock("@/components/molecules/MiMundoButterflyTrails", () => ({
  MiMundoButterflyTrails: () => null,
}));

import { MiMundoHero } from "@/components/organisms/MiMundoHero";

const dict = dictEs as Dictionary;

describe("MiMundoHero LCP", () => {
  it("uses one priority backdrop img and a lazy logo", () => {
    const { container } = render(
      <MiMundoHero
        dict={dict}
        locale="es"
        logoPath="/images/mimundo/logo.png"
        logoAlt="logo"
        backdropSrc="/images/mimundo/inicio/hero-bg.jpg"
      />,
    );
    const backdrop = container.querySelector(
      'img[src="/images/mimundo/inicio/hero-bg.jpg"]',
    );
    expect(backdrop).toHaveAttribute("data-priority", "true");
    const logo = container.querySelector('img[src="/images/mimundo/logo.png"]');
    expect(logo).toHaveAttribute("data-priority", "false");
  });
});
