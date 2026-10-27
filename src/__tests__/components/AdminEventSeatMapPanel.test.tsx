import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminEventSeatMapPanel } from "@/components/dashboard/admin/events/seat-map/AdminEventSeatMapPanel";
import { createDefaultEventSeatMapConfig } from "@/lib/events/seatMapModel";
import en from "@/dictionaries/en.json";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventSeatMapActions", () => ({
  saveEventSeatMapConfigAction: vi.fn(async () => ({ ok: true })),
}));

describe("AdminEventSeatMapPanel", () => {
  it("shows the full default seat matrix immediately when enabled and lets staff paint rows/columns/cells", async () => {
    const user = userEvent.setup();
    render(
      <AdminEventSeatMapPanel
        locale="en"
        eventId="ev-1"
        initialConfig={createDefaultEventSeatMapConfig()}
        seatLocks={[]}
        labels={en.admin.events.seatMap}
      />,
    );

    const toggle = screen.getByRole("checkbox", {
      name: en.admin.events.seatMap.enabledLabel,
    });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();

    // Stage 1 (Matrix dimensions) and Stage 2 (Paint seat availability) are immediately visible
    expect(screen.getByText(en.admin.events.seatMap.step1Title)).toBeInTheDocument();
    expect(screen.getByText(en.admin.events.seatMap.step2Title)).toBeInTheDocument();
    expect(screen.getByLabelText(en.admin.events.seatMap.rowsLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(en.admin.events.seatMap.colsLabel)).toBeInTheDocument();

    // Click a single seat to paint it hidden (160 -> 159), then click it again to unpaint back to free (159 -> 160)
    const seatA1 = screen.getByRole("button", { name: "Platea Baja · A-1" });
    await user.click(seatA1);
    expect(screen.getAllByText("159")).toHaveLength(2);

    const hiddenSeatCell = screen.getAllByRole("button", { name: "Platea Baja · A" })[0]!;
    await user.click(hiddenSeatCell);
    expect(screen.getAllByText("160")).toHaveLength(2);

    // Click column 1 header to paint an aisle (160 -> 150), click again to unpaint (150 -> 160)
    const col1Btn = screen.getByRole("button", {
      name: en.admin.events.seatMap.paintColAria.replace("{col}", "1"),
    });
    await user.click(col1Btn);
    expect(screen.getAllByText("150")).toHaveLength(2);

    await user.click(col1Btn);
    expect(screen.getAllByText("160")).toHaveLength(2);
  });
});
