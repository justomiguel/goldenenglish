// REGRESSION CHECK: every visible string in the Progress picker is built here, so singular/plural
// selection and placeholder substitution must stay intact across the three locales.

import { describe, expect, it } from "vitest";
import {
  formatProgressSectionCount,
  formatProgressUnread,
  formatProgressUnreadAria,
  progressSectionLabel,
} from "@/lib/parent/formatProgressSectionLabels";
import { dictEn } from "@/test/dictEn";

const copy = dictEn.dashboard.parent.progressPicker;

describe("formatProgressSectionCount", () => {
  it("uses the singular noun of each section", () => {
    expect(formatProgressSectionCount("exams", 1, copy)).toBe("1 exam");
    expect(formatProgressSectionCount("tasks", 1, copy)).toBe("1 task");
    expect(formatProgressSectionCount("assessments", 1, copy)).toBe("1 mini-test");
    expect(formatProgressSectionCount("feedback", 1, copy)).toBe("1 comment");
    expect(formatProgressSectionCount("badges", 1, copy)).toBe("1 achievement");
  });

  it("uses the plural noun with the count substituted", () => {
    expect(formatProgressSectionCount("tasks", 4, copy)).toBe("4 tasks");
    expect(formatProgressSectionCount("feedback", 12, copy)).toBe("12 comments");
  });

  it("treats zero as plural", () => {
    expect(formatProgressSectionCount("badges", 0, copy)).toBe("0 achievements");
  });
});

describe("formatProgressUnread", () => {
  it("returns null when there is nothing unread", () => {
    expect(formatProgressUnread(0, copy)).toBeNull();
  });

  it("switches between singular and plural", () => {
    expect(formatProgressUnread(1, copy)).toBe("1 unread");
    expect(formatProgressUnread(5, copy)).toBe("5 unread");
  });
});

describe("formatProgressUnreadAria", () => {
  it("names the section the count belongs to", () => {
    expect(formatProgressUnreadAria(3, "Feedback", copy)).toBe("3 unread in Feedback");
  });
});

describe("progressSectionLabel", () => {
  // The teacher's exams own the word "Evaluaciones"; the learning-route section is a mini-test.
  it("separates the teacher's exams from the learning-route mini-tests", () => {
    expect(progressSectionLabel("exams", copy)).toBe("Exams");
    expect(progressSectionLabel("assessments", copy)).toBe("Mini-tests");
  });

  it("names the remaining sections", () => {
    expect(progressSectionLabel("tasks", copy)).toBe("Tasks");
    expect(progressSectionLabel("feedback", copy)).toBe("Feedback");
    expect(progressSectionLabel("badges", copy)).toBe("Achievements");
  });
});
