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
  it("does not add a second call to action next to the course copy", () => {
    render(
      <LandingMozarthitosCursosSection dict={dict} locale="es" imgOferta={(file) => `/img/${file}`} />,
    );

    expect(screen.queryByRole("link", { name: "Modalidad Online" })).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
