import { describe, expect, it } from "vitest";
import { PARENT_BULK_CAP, capParentRecipients } from "@/lib/parents/capParentRecipients";

describe("capParentRecipients", () => {
  it("sorts by last name then id and keeps at most 200", () => {
    const rows = [
      { id: "b", lastName: "Zed", firstName: "B" },
      { id: "a", lastName: "Zed", firstName: "A" },
      { id: "c", lastName: "Abe", firstName: "C" },
    ];
    expect(capParentRecipients(rows).map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(PARENT_BULK_CAP).toBe(200);
    const many = Array.from({ length: 205 }, (_, i) => ({
      id: String(i).padStart(3, "0"),
      lastName: "Same",
      firstName: "X",
    }));
    expect(capParentRecipients(many)).toHaveLength(200);
    expect(capParentRecipients(many)[0]?.id).toBe("000");
  });
});
