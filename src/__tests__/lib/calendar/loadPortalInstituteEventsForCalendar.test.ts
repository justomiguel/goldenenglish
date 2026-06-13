import { describe, expect, it } from "vitest";
import {
  filterInstituteEventRowsForViewer,
  mapInstituteEventRowsToPortalCalendarEvents,
} from "@/lib/calendar/loadPortalInstituteEventsForCalendar";

describe("filterInstituteEventRowsForViewer", () => {
  const rows = [
    {
      id: "1",
      slug: "open-day",
      title: "Open day",
      eventDateIso: "2026-06-01T15:00:00.000Z",
      location: null,
      privateToSection: false,
      sectionId: null,
    },
    {
      id: "2",
      slug: "section-only",
      title: "Section only",
      eventDateIso: "2026-06-02T15:00:00.000Z",
      location: "Room A",
      privateToSection: true,
      sectionId: "sec-a",
    },
  ];

  it("shows all rows for admin", () => {
    expect(
      filterInstituteEventRowsForViewer(rows, { role: "admin", viewerSectionIds: [] }),
    ).toHaveLength(2);
  });

  it("hides private section events when viewer lacks section", () => {
    expect(
      filterInstituteEventRowsForViewer(rows, { role: "parent", viewerSectionIds: [] }),
    ).toEqual([rows[0]]);
  });

  it("includes private section events when viewer has matching section", () => {
    expect(
      filterInstituteEventRowsForViewer(rows, { role: "parent", viewerSectionIds: ["sec-a"] }),
    ).toHaveLength(2);
  });
});

describe("mapInstituteEventRowsToPortalCalendarEvents", () => {
  it("maps slug href and institute_event kind", () => {
    const [event] = mapInstituteEventRowsToPortalCalendarEvents(
      [
        {
          id: "ev-1",
          slug: "concierto",
          title: "Concierto",
          eventDateIso: "2026-06-01T18:00:00.000Z",
          location: "Auditorio",
          privateToSection: false,
          sectionId: null,
        },
      ],
      "es",
    );
    expect(event.kind).toBe("institute_event");
    expect(event.publicHref).toBe("/es/events/concierto");
    expect(event.roomLabel).toBe("Auditorio");
    expect(event.end > event.start).toBe(true);
  });
});
