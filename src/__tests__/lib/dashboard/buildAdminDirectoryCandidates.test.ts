import { describe, expect, it } from "vitest";
import { buildAdminDirectoryCandidates } from "@/lib/dashboard/buildAdminDirectoryCandidates";

describe("buildAdminDirectoryCandidates", () => {
  it("maps student extras into filter facts", () => {
    const [row] = buildAdminDirectoryCandidates({
      profiles: [
        {
          id: "s1",
          phone: "  ",
          created_at: "2026-08-01T00:00:00.000Z",
          last_session_start_at: null,
        },
      ],
      sectionsByPerson: new Map([
        [
          "s1",
          [
            { id: "sec-a", discountPercent: 20 },
            { id: "sec-b", discountPercent: null },
          ],
        ],
      ]),
      parentsByStudent: new Map([["s1", [{ id: "p1" }]]]),
      monthlyDueByStudent: new Map([["s1", [{ amount: 10 }]]]),
    });
    expect(row).toMatchObject({
      id: "s1",
      phone: "",
      lastSessionStartAt: null,
      sectionIds: ["sec-a", "sec-b"],
      hasParentLink: true,
      hasScholarship: true,
      hasDue: true,
    });
  });

  it("maps teacher lead and assistant ids", () => {
    const [row] = buildAdminDirectoryCandidates({
      profiles: [{ id: "t1", phone: "1", created_at: null, last_session_start_at: "x" }],
      sectionsByPerson: new Map([["t1", [{ id: "sec-a" }, { id: "sec-b" }]]]),
      leadIdsByTeacher: new Map([["t1", ["sec-a"]]]),
      assistantIdsByTeacher: new Map([["t1", ["sec-b"]]]),
    });
    expect(row.leadSectionIds).toEqual(["sec-a"]);
    expect(row.assistantSectionIds).toEqual(["sec-b"]);
    expect(row.sectionIds).toEqual(["sec-a", "sec-b"]);
  });
});
