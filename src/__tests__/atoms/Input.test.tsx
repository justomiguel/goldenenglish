import { useState } from "react";
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "@/components/atoms/Input";

describe("Input", () => {
  it("sets aria-invalid when error", () => {
    render(<Input error="Bad" aria-label="Email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("lets the user clear a lone 0 on a number field even if the parent stores a number", () => {
    function Probe() {
      const [amount, setAmount] = useState(0);
      return (
        <Input
          aria-label="Amount"
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      );
    }
    render(<Probe />);
    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue(null);
  });
});
