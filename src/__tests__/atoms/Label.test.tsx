import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "@/components/atoms/Label";

describe("Label", () => {
  it("shows required marker", () => {
    render(<Label required>Name</Label>);
    const label = screen.getByText("Name");
    expect(label.querySelector('[aria-hidden="true"]')).toHaveTextContent("*");
  });
});
