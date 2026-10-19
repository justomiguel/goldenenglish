import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminEventPriceCell } from "@/components/molecules/AdminEventPriceCell";

describe("AdminEventPriceCell", () => {
  it("lists each flow amount when the event is priced by flow", () => {
    render(
      <AdminEventPriceCell
        priceByFlow
        flowPrices={[
          { id: "academy", name: "Academia", price: 40000 },
          { id: "guest", name: "Visitante", price: 0 },
        ]}
        price={80000}
        currency="CLP"
        locale="es"
        freeLabel="Gratis"
      />,
    );

    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByText("Gratis")).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/40\.000,00/);
    expect(screen.queryByText("CLP 80000.00")).not.toBeInTheDocument();
  });

  it("keeps the single price when the event is not priced by flow", () => {
    render(
      <AdminEventPriceCell
        priceByFlow={false}
        flowPrices={[]}
        price={15000}
        currency="CLP"
        locale="es"
        freeLabel="Gratis"
      />,
    );

    expect(screen.getByText("CLP 15000.00")).toBeInTheDocument();
  });
});
