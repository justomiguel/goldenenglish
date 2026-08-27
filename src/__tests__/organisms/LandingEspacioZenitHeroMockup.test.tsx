import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

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
    priority,
  }: {
    src: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" data-priority={priority ? "true" : "false"} />
  ),
}));

import { LandingEspacioZenitHeroMockup } from "@/components/organisms/LandingEspacioZenitHeroMockup";

const dict = dictEs as Dictionary;
const brush1 = marketingLandingCopy(dict, "ez", "hero.brushLine1");

describe("LandingEspacioZenitHeroMockup LCP", () => {
  it("exposes the first brush line as h1 and only the left dancer is priority", () => {
    const { container } = render(
      <LandingEspacioZenitHeroMockup
        dict={dict}
        locale="es"
        logoSrc="/logo.png"
        logoAlt="logo"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: brush1 }),
    ).toBeInTheDocument();
    const left = container.querySelector(
      'img[src="/images/espaciozenit/landing/1.png"]',
    );
    const right = container.querySelector(
      'img[src="/images/espaciozenit/landing/2.png"]',
    );
    expect(left).toHaveAttribute("data-priority", "true");
    expect(right).toHaveAttribute("data-priority", "false");
  });
});
