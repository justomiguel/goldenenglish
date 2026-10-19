import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicEventDetailPanel } from "@/components/molecules/PublicEventDetailPanel";

const labels = {
  registrationCardTitle: "Inscripción",
  dateLabel: "Fecha",
  locationLabel: "Lugar",
  priceLabel: "Precio",
  free: "Gratis",
  priceLocal: "Local",
  priceNonLocal: "No local",
  registerCta: "Inscribirme",
};

describe("PublicEventDetailPanel", () => {
  it("lists each flow price on the event page", () => {
    render(
      <PublicEventDetailPanel
        locale="es"
        eventDate="2026-11-29T17:00:00.000Z"
        location="Santiago"
        priceSource={{ price: 80000, priceLocal: 80000, priceNonLocal: 80000 }}
        flowPrices={[
          { id: "academy", name: "Academia", price: 40000 },
          { id: "guest", name: "Visitante", price: 80000 },
        ]}
        currency="CLP"
        registerHref="/es/events/capoeira-me-chama/register"
        labels={labels}
      />,
    );

    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/40\.000,00/);
    expect(document.body.textContent).toMatch(/80\.000,00/);
  });
});
