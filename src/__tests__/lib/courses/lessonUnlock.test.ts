import { describe, expect, it } from "vitest";
import { lessonIsUnlocked } from "@/lib/courses/lessonUnlock";

describe("lessonIsUnlocked", () => {
  it("unlocks every lesson when the course is open", () => {
    expect(
      lessonIsUnlocked({ mode: "open", lessonIndex: 3, completedIndexes: new Set() }),
    ).toBe(true);
  });

  it("unlocks the first lesson in sequential mode", () => {
    expect(
      lessonIsUnlocked({ mode: "sequential", lessonIndex: 0, completedIndexes: new Set() }),
    ).toBe(true);
  });

  it("locks the next lesson until the previous one is complete", () => {
    expect(
      lessonIsUnlocked({ mode: "sequential", lessonIndex: 1, completedIndexes: new Set() }),
    ).toBe(false);
    expect(
      lessonIsUnlocked({ mode: "sequential", lessonIndex: 1, completedIndexes: new Set([0]) }),
    ).toBe(true);
  });
});
