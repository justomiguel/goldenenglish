import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventRegisterFamilyDiscount } from "@/components/organisms/EventRegisterFamilyDiscount";

const label = "I am part of an institute family (10% off)";
const payLabel = "With the discount you pay";

describe("EventRegisterFamilyDiscount", () => {
  it("starts unchecked and shows the discounted amount only after it is checked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <EventRegisterFamilyDiscount
        baseAmount={10000}
        currency="CLP"
        locale="es"
        freeLabel="Gratis"
        checked={false}
        onChange={onChange}
        label={label}
        payLabel={payLabel}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: label });
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByText(payLabel)).toBeNull();

    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(
      <EventRegisterFamilyDiscount
        baseAmount={10000}
        currency="CLP"
        locale="es"
        freeLabel="Gratis"
        checked
        onChange={onChange}
        label={label}
        payLabel={payLabel}
      />,
    );

    expect(screen.getByText(payLabel, { exact: false })).toBeTruthy();
    expect(screen.getByText(/9000/)).toBeTruthy();
  });

  it("hides the checkbox when registration is free", () => {
    render(
      <EventRegisterFamilyDiscount
        baseAmount={0}
        currency="CLP"
        locale="es"
        freeLabel="Gratis"
        checked={false}
        onChange={vi.fn()}
        label={label}
        payLabel={payLabel}
      />,
    );

    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
