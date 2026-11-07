import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { LandingMozarthitosCursosSection } from "@/components/organisms/LandingMozarthitosCursosSection";
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

const dict = dictEs as Dictionary;

describe("LandingMozarthitosCursosSection", () => {
  it("opens the family guide on the remote path from the online CTA", () => {
    render(
      <LandingMozarthitosCursosSection dict={dict} locale="es" imgOferta={(file) => `/img/${file}`} />,
    );

    const online = screen.getByRole("link", { name: "Modalidad Online" });
    expect(online).toHaveAttribute("href", "/es/encuentra-tu-clase?modalidad=remote");
    expect(online).not.toHaveAttribute("href", "/es#contacto");
  });
});
