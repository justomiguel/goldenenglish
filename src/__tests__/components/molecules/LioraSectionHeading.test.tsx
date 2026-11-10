import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";

describe("LioraSectionHeading", () => {
  it("reads the title and the script line as one heading", () => {
    render(<LioraSectionHeading title="Ballet" script="para todas las edades" />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Ballet para todas las edades" }),
    ).toBeInTheDocument();
  });

  it("renders an h1 with an id for the hero", () => {
    render(<LioraSectionHeading as="h1" id="hero-title" title="Ballet" script="x" size="hero" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("id", "hero-title");
  });

  it("hides the heart rule from assistive technology and keeps the lead", () => {
    const { container } = render(
      <LioraSectionHeading title="Clases" lead="Grupos pequeños" align="end" />,
    );
    const rule = container.querySelector(".liora-heart-rule");
    expect(rule).toHaveAttribute("aria-hidden", "true");
    expect(rule).toHaveAttribute("data-align", "end");
    expect(screen.getByText("Grupos pequeños")).toBeInTheDocument();
  });

  it("omits the script line and lead when they are empty", () => {
    const { container } = render(<LioraSectionHeading title="Sedes" />);
    expect(container.querySelector(".liora-script")).toBeNull();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});
