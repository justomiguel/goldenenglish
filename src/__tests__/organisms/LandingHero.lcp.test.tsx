import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

vi.mock("@/components/molecules/LandingTiltedPhoto", () => ({
  LandingTiltedPhoto: ({
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

import { LandingHero } from "@/components/organisms/LandingHero";

describe("LandingHero LCP", () => {
  it("marks only the first collage photo as priority", () => {
    const { container } = render(
      <LandingHero
        dict={dictEs as Dictionary}
        brand={mockBrandPublic}
        locale="es"
      />,
    );
    const flagged = [...container.querySelectorAll("img")].filter(
      (el) => el.getAttribute("data-priority") === "true",
    );
    expect(flagged).toHaveLength(1);
  });
});
