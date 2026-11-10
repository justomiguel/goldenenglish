import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  }
});

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import { LandingMozarthitosCursosSection } from "@/components/organisms/LandingMozarthitosCursosSection";

const dict = dictEs as Dictionary;

describe("LandingMozarthitosCursosSection", () => {
  it("sends the online CTA to the guide with remote preselected", () => {
    const { container } = render(<LandingMozarthitosCursosSection dict={dict} locale="es" imgOferta={(f) => `/img/${f}`} />);
    const link = container.querySelector('a[href="/es/encuentra-tu-clase?modalidad=remote"]');
    expect(link).toBeTruthy();
  });
});
