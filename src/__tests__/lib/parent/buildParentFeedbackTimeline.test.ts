import { describe, it, expect } from "vitest";
import {
  PARENT_FEEDBACK_NEW_WINDOW_DAYS,
  buildParentFeedbackTimeline,
  isRecentParentFeedback,
} from "@/lib/parent/buildParentFeedbackTimeline";
import type { ParentFeedbackItem } from "@/types/parentFeedback";

// REGRESSION CHECK: this builder is the single gate that decides what families read as
// "teacher feedback". Breaking it may (a) surface rows without teacher text, (b) reorder the
// timeline away from newest-first, or (c) miscount the "new" badge on the Progress tab.

type Draft = Omit<ParentFeedbackItem, "isNew">;

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: "assessment:g1",
    source: "assessment",
    studentId: "stu-1",
    childLabel: "Adams, Zara",
    title: "Unit 3 exam",
    contextLabel: "B1 — Group A",
    teacherName: "Ruiz, Marta",
    occurredOn: "2026-08-01",
    score: 82,
    maxScore: 100,
    feedback: "Great progress on fluency.",
    ...overrides,
  };
}

const NOW = new Date("2026-08-07T12:00:00.000Z");

describe("buildParentFeedbackTimeline", () => {
  it("keeps only entries carrying teacher text", () => {
    const timeline = buildParentFeedbackTimeline({
      entries: [
        draft({ id: "a", feedback: "Well done." }),
        draft({ id: "b", feedback: "" }),
        draft({ id: "c", feedback: "   \n  " }),
      ],
      now: NOW,
    });

    expect(timeline.items.map((item) => item.id)).toEqual(["a"]);
  });

  it("trims stored feedback text", () => {
    const timeline = buildParentFeedbackTimeline({
      entries: [draft({ feedback: "  Keep practising listening.\n" })],
      now: NOW,
    });

    expect(timeline.items[0].feedback).toBe("Keep practising listening.");
  });

  it("orders newest first across both sources", () => {
    const timeline = buildParentFeedbackTimeline({
      entries: [
        draft({ id: "old", source: "assessment", occurredOn: "2026-05-02" }),
        draft({ id: "new", source: "learning", occurredOn: "2026-08-06" }),
        draft({ id: "mid", source: "assessment", occurredOn: "2026-07-01" }),
      ],
      now: NOW,
    });

    expect(timeline.items.map((item) => item.id)).toEqual(["new", "mid", "old"]);
  });

  it("bounds the timeline to the requested limit", () => {
    const entries = Array.from({ length: 30 }, (_, index) =>
      draft({ id: `e${index}`, occurredOn: `2026-07-${String((index % 28) + 1).padStart(2, "0")}` }),
    );

    const timeline = buildParentFeedbackTimeline({ entries, now: NOW, limit: 5 });

    expect(timeline.items).toHaveLength(5);
  });

  it("flags and counts entries inside the recency window", () => {
    const timeline = buildParentFeedbackTimeline({
      entries: [
        draft({ id: "fresh", occurredOn: "2026-08-06" }),
        draft({ id: "edge", occurredOn: "2026-07-24" }),
        draft({ id: "stale", occurredOn: "2026-06-01" }),
      ],
      now: NOW,
    });

    expect(timeline.items.map((item) => [item.id, item.isNew])).toEqual([
      ["fresh", true],
      ["edge", true],
      ["stale", false],
    ]);
    expect(timeline.newCount).toBe(2);
  });

  it("never marks future-dated rows as stale", () => {
    const timeline = buildParentFeedbackTimeline({
      entries: [draft({ occurredOn: "2026-09-01" })],
      now: NOW,
    });

    expect(timeline.items[0].isNew).toBe(true);
  });

  it("drops entries without a usable date instead of crashing", () => {
    const timeline = buildParentFeedbackTimeline({
      entries: [draft({ id: "bad", occurredOn: "" }), draft({ id: "ok" })],
      now: NOW,
    });

    expect(timeline.items.map((item) => item.id)).toEqual(["ok"]);
  });

  it("returns an empty timeline for no input", () => {
    expect(buildParentFeedbackTimeline({ entries: [], now: NOW })).toEqual({
      items: [],
      newCount: 0,
    });
  });
});

describe("isRecentParentFeedback", () => {
  it("uses the shared window constant", () => {
    const withinWindow = new Date(NOW);
    withinWindow.setUTCDate(withinWindow.getUTCDate() - (PARENT_FEEDBACK_NEW_WINDOW_DAYS - 1));

    expect(isRecentParentFeedback(withinWindow.toISOString().slice(0, 10), NOW)).toBe(true);
  });

  it("rejects dates older than the window", () => {
    const outsideWindow = new Date(NOW);
    outsideWindow.setUTCDate(outsideWindow.getUTCDate() - (PARENT_FEEDBACK_NEW_WINDOW_DAYS + 1));

    expect(isRecentParentFeedback(outsideWindow.toISOString().slice(0, 10), NOW)).toBe(false);
  });

  it("rejects unparseable input", () => {
    expect(isRecentParentFeedback("not-a-date", NOW)).toBe(false);
  });
});
