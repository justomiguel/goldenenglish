import { describe, expect, it } from "vitest";
import { sortSectionRosterRows } from "@/lib/academics/sortSectionRosterRows";

describe("sortSectionRosterRows", () => {
  const rows = [
    { enrollmentId: "1", studentId: "a", label: "Zeta Ana", status: "active" },
    { enrollmentId: "2", studentId: "b", label: "Alpha Bea", status: "active" },
  ];

  it("sorts by label ascending", () => {
    const s = sortSectionRosterRows(rows, "label", "asc");
    expect(s.map((r) => r.label)).toEqual(["Alpha Bea", "Zeta Ana"]);
  });

  it("sorts by status", () => {
    const mixed = [
      { enrollmentId: "1", studentId: "a", label: "A", status: "z" },
      { enrollmentId: "2", studentId: "b", label: "B", status: "a" },
    ];
    const s = sortSectionRosterRows(mixed, "status", "asc");
    expect(s.map((r) => r.status)).toEqual(["a", "z"]);
  });
});
