import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminEventPaymentChargeLines } from "@/components/dashboard/admin/events/AdminEventPaymentChargeLines";

const labels = {
  adultLine: "Adults: {count} × {price}",
  minorLine: "Minors: {count} × {price}",
  codeLine: "Code {code}: {amount}",
  codePercentLine: "Code {code} ({percent}%): {amount}",
  familyLine: "Family discount: {amount}",
};

describe("AdminEventPaymentChargeLines", () => {
  it("shows the minor split and the code under the total", () => {
    render(
      <AdminEventPaymentChargeLines
        locale="es-CL"
        currency="CLP"
        labels={labels}
        lines={{
          amount: 12000,
          adultTickets: 1,
          unitPrice: 10000,
          minorTickets: 1,
          minorUnitPrice: 4000,
          discount: { kind: "code", code: "FIJO", percent: null, amountOff: 2000 },
        }}
      />,
    );
    expect(screen.getByText(/Adults: 1/)).toBeTruthy();
    expect(screen.getByText(/Minors: 1/)).toBeTruthy();
    expect(screen.getByText(/Code FIJO:/)).toBeTruthy();
  });

  it("hides the lines when nothing was discounted", () => {
    const { container } = render(
      <AdminEventPaymentChargeLines
        locale="es-CL"
        currency="CLP"
        labels={labels}
        lines={{
          amount: 10000,
          adultTickets: 1,
          unitPrice: 10000,
          minorTickets: 0,
          minorUnitPrice: null,
          discount: null,
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
