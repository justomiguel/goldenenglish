import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NagoSplitWords } from "@/components/organisms/NagoSplitWords";

const parts = [
  { text: "Capoeira que" },
  { text: "transforma.", accent: true },
] as const;

describe("NagoSplitWords", () => {
  it("exposes the full title and hides split words", () => {
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

    render(
      <NagoSplitWords id="nago-hero-title" className="nago-hero-title" parts={parts} />,
    );
    const heading = screen.getByRole("heading", { name: "Capoeira que transforma." });
    expect(heading).toHaveAttribute("id", "nago-hero-title");
    expect(heading.querySelectorAll("[aria-hidden='true']")).toHaveLength(3);
    expect(heading.querySelector(".nago-hero-title-accent")?.textContent).toBe(
      "transforma.",
    );
  });

  it("renders unsplit children when motion is reduced", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    render(
      <NagoSplitWords id="nago-hero-title" className="nago-hero-title" parts={parts} />,
    );
    const heading = screen.getByRole("heading", { name: /transforma/i });
    expect(heading.querySelectorAll(".nago-split-word")).toHaveLength(0);
    expect(heading).not.toHaveAttribute("aria-label");
  });
});
