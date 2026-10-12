/** @vitest-environment node */
// REGRESSION CHECK: Home popup eligibility must ignore drafts, archived, private,
// past, and unmarked events, and must keep at most eight soonest upcoming events.
import { describe, expect, it } from "vitest";
import {
  HOME_EVENT_POPUP_LIMIT,
  selectHomePopupEvents,
  type HomePopupEventCandidate,
} from "@/lib/events/selectHomePopupEvents";

const NOW = new Date("2026-10-10T15:00:00.000Z");

function row(overrides: Partial<HomePopupEventCandidate> & Pick<HomePopupEventCandidate, "id" | "eventDate">): HomePopupEventCandidate {
  return {
    status: "published",
    archivedAt: null,
    privateToSection: false,
    showOnHome: true,
    ...overrides,
  };
}

describe("selectHomePopupEvents", () => {
  it("keeps only published, public, upcoming events marked for the home, soonest first", () => {
    const selected = selectHomePopupEvents(
      [
        row({ id: "later", eventDate: "2026-12-01T12:00:00.000Z" }),
        row({ id: "draft", eventDate: "2026-10-11T12:00:00.000Z", status: "draft" }),
        row({ id: "archived", eventDate: "2026-10-11T12:00:00.000Z", archivedAt: "2026-10-01T00:00:00.000Z" }),
        row({ id: "private", eventDate: "2026-10-11T12:00:00.000Z", privateToSection: true }),
        row({ id: "past", eventDate: "2026-10-01T12:00:00.000Z" }),
        row({ id: "unmarked", eventDate: "2026-10-11T12:00:00.000Z", showOnHome: false }),
        row({ id: "sooner", eventDate: "2026-10-20T12:00:00.000Z" }),
        row({ id: "closed", eventDate: "2026-10-12T12:00:00.000Z", status: "closed" }),
      ],
      NOW,
    );

    expect(selected.map((event) => event.id)).toEqual(["sooner", "later"]);
  });

  it("caps the carousel at eight events", () => {
    const rows = Array.from({ length: 10 }, (_, index) =>
      row({
        id: `e${index}`,
        eventDate: new Date(Date.UTC(2026, 10, index + 1, 12)).toISOString(),
      }),
    );

    const selected = selectHomePopupEvents(rows, NOW);

    expect(selected).toHaveLength(HOME_EVENT_POPUP_LIMIT);
    expect(selected[0]?.id).toBe("e0");
    expect(selected.at(-1)?.id).toBe("e7");
  });
});
