import { describe, expect, it } from "vitest";
import { selectSectionNotices } from "@/lib/courses/sectionNotices";

describe("selectSectionNotices", () => {
  it("keeps five active notices for the viewer sections, newest first", () => {
    const notices = [1, 2, 3, 4, 5, 6].map((n) => ({
      id: String(n),
      sectionId: "section",
      body: `Note ${n}`,
      publishedAt: `2026-01-0${n}T00:00:00.000Z`,
      archivedAt: n === 6 ? null : null,
    }));
    notices.push({
      id: "old",
      sectionId: "section",
      body: "Archived",
      publishedAt: "2026-02-01T00:00:00.000Z",
      archivedAt: "2026-02-02T00:00:00.000Z",
    });
    notices.push({
      id: "other",
      sectionId: "other",
      body: "Other",
      publishedAt: "2026-03-01T00:00:00.000Z",
      archivedAt: null,
    });
    const selected = selectSectionNotices(notices, ["section"]);
    expect(selected).toHaveLength(5);
    expect(selected[0]?.id).toBe("6");
    expect(selected.map((notice) => notice.id)).not.toContain("old");
    expect(selected.map((notice) => notice.id)).not.toContain("other");
  });
});
