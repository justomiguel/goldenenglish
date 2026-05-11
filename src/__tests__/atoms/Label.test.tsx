import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "@/components/atoms/Label";

describe("Label", () => {
  it("applies required marker via pseudo-element utility (keeps label textContent matchable)", () => {
    render(<Label required>Name</Label>);
    const label = screen.getByText("Name");
    expect(label.className).toMatch(/after:content-/);
  });
});
