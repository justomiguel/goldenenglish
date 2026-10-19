import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventRegisterFlowChoice } from "@/components/organisms/EventRegisterFlowChoice";

describe("EventRegisterFlowChoice", () => {
  it("shows each flow price beside the option", () => {
    render(
      <EventRegisterFlowChoice
        label="¿En qué modalidad te inscribes?"
        flows={[
          { id: "academy", name: "Academia", price: 40000 },
          { id: "guest", name: "Visitante", price: 80000 },
        ]}
        value="academy"
        onChange={() => undefined}
        showPrices
        currency="CLP"
        locale="es"
        freeLabel="Gratis"
      />,
    );

    const academy = screen.getByRole("radio", { name: /Academia/ });
    expect(academy).toBeChecked();
    expect(academy.closest("label")?.textContent).toMatch(/40\.000,00/);
    const guest = screen.getByRole("radio", { name: /Visitante/ });
    expect(guest.closest("label")?.textContent).toMatch(/80\.000,00/);
  });
});
