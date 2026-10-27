// REGRESSION CHECK: Changing EventRegisterSeatPicker may affect public event checkout seat selection, armchair SVG rendering, hidden seat spacers, and row/stage alignment.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EventRegisterSeatPicker } from "@/components/organisms/EventRegisterSeatPicker";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";
import en from "@/dictionaries/en.json";

const config: EventSeatMapConfig = {
  enabled: true,
  floors: [
    {
      id: "f1",
      name: "Platea Baja",
      order: 0,
      guideImageUrl: null,
      stage: { x: 200, y: 30, width: 600, height: 60, label: "STAGE", position: "top" },
      blocks: [
        {
          id: "b1",
          label: "Main",
          x: 100,
          y: 150,
          width: 400,
          height: 150,
          rows: 1,
          cols: 4,
          startRowLabel: "A",
          startSeatNumber: 1,
          splitIntoTwo: true,
          aisleAfterCol: 2,
          hiddenSeats: ["0:1"],
          reservedSeats: ["0:3"],
        },
      ],
    },
  ],
};

function Harness({ requiredCount = 2 }: { requiredCount?: number }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <EventRegisterSeatPicker
      config={config}
      locks={[
        { seatKey: "f1:b1:0:2", attendeeStatus: "pending_payment" },
      ]}
      requiredSeatCount={requiredCount}
      selectedSeatKeys={selected}
      onSelectedSeatKeysChange={setSelected}
      labels={en.events.register.seatMap}
    />
  );
}

describe("EventRegisterSeatPicker", () => {
  it("renders theater armchair seats, row badges, hidden seat spacers, and toggles free seats", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness requiredCount={1} />);

    expect(screen.getByText("STAGE")).toBeInTheDocument();
    expect(screen.getAllByText("A").length).toBeGreaterThanOrEqual(2);

    const freeSeat = screen.getByRole("button", { name: /Platea Baja · A-1/i });
    const pendingSeat = screen.getByRole("button", { name: /Platea Baja · A-2/i });
    const reservedSeat = screen.getByRole("button", { name: /Platea Baja · A-3/i });

    expect(within(freeSeat).getByTestId("theater-seat-svg")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-seat-spacer="true"]').length).toBe(1);
    const viewport = container.querySelector('[data-seat-map-viewport="fit"]');
    expect(viewport).not.toBeNull();
    expect(viewport?.className).toContain("overflow-hidden");

    expect(pendingSeat).toBeDisabled();
    expect(reservedSeat).toBeDisabled();
    expect(freeSeat).not.toBeDisabled();

    await user.click(freeSeat);
    expect(screen.getByText("Platea Baja · A-1")).toBeInTheDocument();
  });
});
