import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LioraLockup } from "@/components/molecules/LioraLockup";

describe("LioraLockup", () => {
  it("shows the brand name with the last word as the accent", () => {
    render(<LioraLockup brandName="Liora Studio" motto="Danza · Movimiento · Pasión" />);
    expect(screen.getByText("Liora")).toBeInTheDocument();
    expect(screen.getByText("Studio")).toBeInTheDocument();
  });

  it("shows the motto while open and hides it from readers when compact", () => {
    const { rerender, container } = render(<LioraLockup brandName="Liora Studio" motto="Danza" />);
    const motto = () => container.querySelector("[data-lockup-motto]");
    expect(motto()).toHaveAttribute("aria-hidden", "false");
    rerender(<LioraLockup brandName="Liora Studio" motto="Danza" compact />);
    expect(motto()).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps a one-word brand without an accent", () => {
    const { container } = render(<LioraLockup brandName="Liora" />);
    expect(container.textContent).toBe("Liora");
  });

  it("draws the dancer figure as decoration", () => {
    const { container } = render(<LioraLockup brandName="Liora Studio" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
