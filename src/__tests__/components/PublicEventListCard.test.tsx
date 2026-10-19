import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicEventListCard } from "@/components/molecules/PublicEventListCard";
import type { PublicEventListRow } from "@/lib/dashboard/events/loadPublicEventsList";

const labels = {
  dateLabel: "Fecha",
  priceLabel: "Precio",
  free: "Gratis",
  priceLocal: "Local",
  priceNonLocal: "No local",
  viewDetail: "Ver evento",
  adminEdit: "Editar",
  adminEditAriaLabel: "Editar evento",
};

function row(overrides: Partial<PublicEventListRow> = {}): PublicEventListRow {
  return {
    id: "event-1",
    slug: "capoeira-me-chama",
    title: "Capoeira Me Chama",
    description: "",
    coverImageUrl: null,
    eventDate: "2026-11-29T17:00:00.000Z",
    location: null,
    capacity: 40,
    price: 80000,
    priceLocal: 80000,
    priceNonLocal: 80000,
    hasTieredPricing: false,
    currency: "CLP",
    priceByFlow: true,
    flowPrices: [
      { id: "academy", name: "Academia", price: 40000 },
      { id: "guest", name: "Visitante", price: 80000 },
    ],
    ...overrides,
  };
}

describe("PublicEventListCard", () => {
  it("lists each flow price instead of the single event price", () => {
    render(<PublicEventListCard locale="es" row={row()} labels={labels} />);

    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByText("Visitante")).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/40\.000,00/);
    expect(document.body.textContent).toMatch(/80\.000,00/);
    expect(screen.queryByText("CLP 80000.00")).not.toBeInTheDocument();
  });
});
