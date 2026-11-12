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

// REGRESSION CHECK: A plain adult purchase must keep the adult count and unit price. Hiding that line brings back the payments tab gap.
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

  it("shows the adult line when the purchase has no minors and no discount", () => {
    render(
      <AdminEventPaymentChargeLines
        locale="es-CL"
        currency="CLP"
        labels={labels}
        lines={{
          amount: 20000,
          adultTickets: 2,
          unitPrice: 10000,
          minorTickets: 0,
          minorUnitPrice: null,
          discount: null,
        }}
      />,
    );
    expect(screen.getByText(/Adults: 2/)).toBeTruthy();
    expect(screen.queryByText(/Minors:/)).toBeNull();
  });

  it("shows the adult line and the discount when there are no minors", () => {
    render(
      <AdminEventPaymentChargeLines
        locale="es-CL"
        currency="CLP"
        labels={labels}
        lines={{
          amount: 8000,
          adultTickets: 1,
          unitPrice: 10000,
          minorTickets: 0,
          minorUnitPrice: null,
          discount: { kind: "code", code: "FIJO", percent: null, amountOff: 2000 },
        }}
      />,
    );
    expect(screen.getByText(/Adults: 1/)).toBeTruthy();
    expect(screen.getByText(/Code FIJO:/)).toBeTruthy();
    expect(screen.queryByText(/Minors:/)).toBeNull();
  });
});
