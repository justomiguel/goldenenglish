import { describe, expect, it } from "vitest";
import { applyPortalSpecialEventIcsPresentation } from "@/lib/calendar/portalSpecialEventIcsPresentation";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";
import dictEn from "@/dictionaries/en.json";

describe("applyPortalSpecialEventIcsPresentation", () => {
  it("prefixes summary and prepends legend to description", () => {
    const rows: ExpandedPortalOccurrence[] = [
      {
        kind: "special",
        title: "Final English I",
        specialEventType: "institutional_exam",
        startMs: 0,
        endMs: 1,
        allDay: true,
        icsUid: "ge-special-x@goldenenglish",
        description: "Bring ID.",
      },
    ];
    const types = dictEn.dashboard.portalCalendar.specialTypes;
    const out = applyPortalSpecialEventIcsPresentation(rows, types);
    expect(out[0]?.icsSummary).toContain("[EXAM]");
    expect(out[0]?.icsSummary).toContain("Final English I");
    expect(out[0]?.icsDescription).toContain(types.institutional_exam.legend);
    expect(out[0]?.icsDescription).toContain("Bring ID.");
  });
});
