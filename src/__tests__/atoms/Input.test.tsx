import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/atoms/Input";

describe("Input", () => {
  it("sets aria-invalid when error", () => {
    render(<Input error="Bad" aria-label="Email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
