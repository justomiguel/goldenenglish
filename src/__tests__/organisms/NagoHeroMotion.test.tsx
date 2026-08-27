import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NagoHeroMotion } from "@/components/organisms/NagoHeroMotion";

describe("NagoHeroMotion", () => {
  it("parallax-shifts the photo and fades the lockup on scroll", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion") ? false : false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const { container } = render(
      <NagoHeroMotion photoSrc="/images/nago/inicio/hero-chile.png">
        <h1 id="nago-hero-title">Somos Nago</h1>
      </NagoHeroMotion>,
    );

    const ken = container.querySelector(".nago-hero-ken") as HTMLElement;
    expect(ken.querySelector('img[src="/images/nago/inicio/hero-chile.png"]')).toBeTruthy();

    const section = container.querySelector(".nago-hero-bg") as HTMLElement;
    const parallax = container.querySelector(".nago-hero-parallax") as HTMLElement;
    const lockup = container.querySelector(".nago-hero-lockup") as HTMLElement;

    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      top: -200,
      height: 800,
      bottom: 600,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: -200,
      toJSON: () => ({}),
    });
    Object.defineProperty(section, "offsetHeight", { configurable: true, value: 800 });

    window.dispatchEvent(new Event("scroll"));

    expect(parallax.style.transform).toContain("52px");
    expect(Number(lockup.style.opacity)).toBeLessThan(1);
    expect(lockup.style.transform).toContain("32px");
  });
});
