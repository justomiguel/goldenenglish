import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventRegisterMinorTicketsField } from "@/components/organisms/EventRegisterMinorTicketsField";
import { eventMinorTicketLabelsWithAge } from "@/lib/events/formatEventMinorAgeLegend";

const labels = {
  label: "Cuántas entradas son de menor",
  hint: "La edad se verifica en el evento.",
  hintWithAge: "Menor: hasta {age} años. La edad se verifica en el evento.",
  adultLine: "Adultos",
  childLine: "Menores",
  invalid: "Revisa",
};

describe("EventRegisterMinorTicketsField", () => {
  it("shows the maximum age in the hint when the event has one", () => {
    const withAge = eventMinorTicketLabelsWithAge(labels, 12, labels.hintWithAge);
    render(
      <EventRegisterMinorTicketsField seats={2} count={1} labels={withAge} onChange={() => undefined} />,
    );
    expect(
      screen.getByText("Menor: hasta 12 años. La edad se verifica en el evento."),
    ).toBeInTheDocument();
  });

  it("keeps the old hint when the event has no age", () => {
    const plain = eventMinorTicketLabelsWithAge(labels, null, labels.hintWithAge);
    render(
      <EventRegisterMinorTicketsField seats={2} count={0} labels={plain} onChange={() => undefined} />,
    );
    expect(screen.getByText("La edad se verifica en el evento.")).toBeInTheDocument();
  });
});
