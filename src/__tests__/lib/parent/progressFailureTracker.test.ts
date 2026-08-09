import { describe, expect, it } from "vitest";
import { createProgressFailureTracker } from "@/lib/parent/progressFailureTracker";

describe("createProgressFailureTracker", () => {
  it("starts with nothing failed", () => {
    expect(createProgressFailureTracker().failedSections()).toEqual([]);
  });

  it("remembers the section behind a reporter that fired", () => {
    const tracker = createProgressFailureTracker();

    tracker.reporterFor("exams")("loadStudentExamResults:assessments");

    expect(tracker.failedSections()).toEqual(["exams"]);
  });

  it("counts a section once even when several of its reads fail", () => {
    const tracker = createProgressFailureTracker();
    const report = tracker.reporterFor("feedback");

    report("loadStudentFeedbackTimeline:grades");
    report("loadStudentFeedbackTimeline:attempts");

    expect(tracker.failedSections()).toEqual(["feedback"]);
  });

  it("keeps failures apart per section", () => {
    const tracker = createProgressFailureTracker();

    tracker.reporterFor("exams")("scope");
    tracker.reporterFor("badges")("scope");

    expect(tracker.failedSections().sort()).toEqual(["badges", "exams"]);
  });
});
