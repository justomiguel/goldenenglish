import { describe, expect, it } from "vitest";
import { courseFinishedAfterLesson, nextCompletionWrite } from "@/lib/courses/courseCompletion";

describe("course completion record", () => {
  it("finishes the course when the last open lesson is this one", () => {
    expect(
      courseFinishedAfterLesson(
        [
          { id: "a", completed: true },
          { id: "b", completed: false },
        ],
        "b",
      ),
    ).toBe(true);
    expect(courseFinishedAfterLesson([{ id: "a", completed: false }], "missing")).toBe(false);
  });

  it("keeps the first date, revokes, and restores", () => {
    expect(nextCompletionWrite({ finished: true, existing: null })).toBe("insert");
    expect(nextCompletionWrite({ finished: true, existing: { revokedAt: null } })).toBe("none");
    expect(nextCompletionWrite({ finished: false, existing: { revokedAt: null } })).toBe("revoke");
    expect(nextCompletionWrite({ finished: true, existing: { revokedAt: "2026-01-01" } })).toBe("restore");
  });
});
