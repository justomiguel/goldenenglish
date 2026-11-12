import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";

describe("MatissReveal", () => {
  it("keeps the content visible when motion is reduced", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })),
    );

    const { container } = render(
      <MatissReveal preset="band">
        <p>Hola</p>
      </MatissReveal>,
    );

    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(container.firstElementChild?.className).not.toContain("matiss-reveal--wait");
    vi.unstubAllGlobals();
  });
});
