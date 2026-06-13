import { describe, expect, it } from "vitest";
import {
  cellKey,
  groupSelectedCellsByStudent,
  parseCellKey,
} from "@/lib/billing/sectionCollectionsCellSelectionKeys";

describe("sectionCollectionsCellSelectionKeys", () => {
  it("round-trips cell keys", () => {
    const key = cellKey("abc", 3);
    expect(key).toBe("abc:3");
    expect(parseCellKey(key)).toEqual({ studentId: "abc", month: 3 });
  });

  it("groups months per student sorted", () => {
    const grouped = groupSelectedCellsByStudent(
      new Set([cellKey("s1", 4), cellKey("s1", 2), cellKey("s2", 1)]),
    );
    expect(grouped.get("s1")).toEqual([2, 4]);
    expect(grouped.get("s2")).toEqual([1]);
  });
});
