import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EventRegisterDiscountCode } from "@/components/organisms/EventRegisterDiscountCode";

const labels = {
  label: "Discount code",
  placeholder: "Enter the code",
  apply: "Apply",
  clear: "Remove code",
  pay: "With this code you pay",
  invalid: "Invalid",
  noUses: "No uses",
  conflict: "Conflict",
};

describe("EventRegisterDiscountCode", () => {
  it("shows the preview price after Apply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true, amount: 4500 }),
      })),
    );
    const onApplied = vi.fn();
    const { rerender } = render(
      <EventRegisterDiscountCode
        slug="open-day"
        locale="es"
        currency="CLP"
        freeLabel="Free"
        flowId={null}
        isLocalResident
        applied={null}
        onApplied={onApplied}
        onClear={vi.fn()}
        labels={labels}
      />,
    );
    fireEvent.change(screen.getByLabelText("Discount code"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByRole("button", { name: "Apply" });
    expect(onApplied).toHaveBeenCalledWith({ code: "SAVE10", amount: 4500 });

    rerender(
      <EventRegisterDiscountCode
        slug="open-day"
        locale="es"
        currency="CLP"
        freeLabel="Free"
        flowId={null}
        isLocalResident
        applied={{ code: "SAVE10", amount: 4500 }}
        onApplied={onApplied}
        onClear={vi.fn()}
        labels={labels}
      />,
    );
    expect(screen.getByText(/With this code you pay/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
