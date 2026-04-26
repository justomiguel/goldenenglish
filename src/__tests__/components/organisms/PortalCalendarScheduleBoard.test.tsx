// REGRESSION CHECK: FullCalendar is mocked; this test guards props wiring and event mapping count.
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { PortalCalendarScheduleBoard } from "@/components/organisms/PortalCalendarScheduleBoard";
import dictEn from "@/dictionaries/en.json";

vi.mock("@fullcalendar/react", () => ({
  __esModule: true,
  default: function MockFullCalendar({ events }: { events?: { id?: string }[] }) {
    return <div data-testid="fc-mock" data-event-count={events?.length ?? 0} />;
  },
}));

const scheduleDict = {
  legend: dictEn.dashboard.portalCalendar.legend,
  specialTypes: dictEn.dashboard.portalCalendar.specialTypes,
  schedule: dictEn.dashboard.portalCalendar.schedule,
};

describe("PortalCalendarScheduleBoard", () => {
  it("passes mapped events to FullCalendar", () => {
    const events = [
      {
        id: "1",
        kind: "class" as const,
        title: "A",
        start: "2026-04-01T10:00:00.000Z",
        end: "2026-04-01T11:00:00.000Z",
      },
      {
        id: "2",
        kind: "exam" as const,
        title: "B",
        start: "2026-04-02T10:00:00.000Z",
        end: "2026-04-02T11:00:00.000Z",
      },
    ];
    render(
      <PortalCalendarScheduleBoard locale="en" events={events} narrowAgenda={false} dict={scheduleDict} />,
    );
    const mock = screen.getByTestId("fc-mock");
    expect(mock).toHaveAttribute("data-event-count", "2");
  });
});
