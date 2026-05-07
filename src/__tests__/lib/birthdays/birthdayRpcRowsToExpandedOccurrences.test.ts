import { describe, it, expect } from "vitest";
import { birthdayRpcRowsToExpandedOccurrences } from "@/lib/birthdays/birthdayRpcRowsToExpandedOccurrences";
import type { PortalBirthdayRpcRow } from "@/types/birthdays";

describe("birthdayRpcRowsToExpandedOccurrences", () => {
  it("builds all-day expanded rows with institute-aligned titles", () => {
    const rows: PortalBirthdayRpcRow[] = [
      {
        student_id: "11111111-1111-1111-1111-111111111111",
        first_name: "Ana",
        last_name: "Pérez",
        birth_date: "2010-06-12",
        celebration_date: "2026-06-12",
        is_celebration_today: false,
      },
    ];
    const out = birthdayRpcRowsToExpandedOccurrences(rows, {
      eventTitle: "Birthday",
      icsPrefix: "[BDAY]",
      icsDescription: "Test",
    });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("birthday");
    expect(out[0].allDay).toBe(true);
    expect(out[0].title).toContain("Pérez");
    expect(out[0].icsSummary?.startsWith("[BDAY]")).toBe(true);
  });
});
