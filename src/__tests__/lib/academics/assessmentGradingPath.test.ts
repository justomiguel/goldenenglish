import { describe, expect, it } from "vitest";
import {
  countAssessmentRosterStatuses,
  isPendingGradeStatus,
  nextPendingEnrollmentId,
  resolveAssessmentPathStep,
} from "@/lib/academics/assessmentGradingPath";

describe("resolveAssessmentPathStep", () => {
  it("is create when no assessment yet", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: false, studentOpen: false, justPublished: false })).toBe(1);
  });
  it("is student when assessment exists and shell closed", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: true, studentOpen: false, justPublished: false })).toBe(2);
  });
  it("is grade when student shell open", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: true, studentOpen: true, justPublished: false })).toBe(3);
  });
  it("is publish briefly after publish success while still open", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: true, studentOpen: true, justPublished: true })).toBe(4);
  });
});

describe("nextPendingEnrollmentId", () => {
  const rows = [
    { enrollmentId: "a", gradeStatus: "published" as const },
    { enrollmentId: "b", gradeStatus: null },
    { enrollmentId: "c", gradeStatus: "draft" as const },
    { enrollmentId: "d", gradeStatus: "published" as const },
  ];
  it("skips published and returns next null/draft after current", () => {
    expect(nextPendingEnrollmentId(rows, "a")).toBe("b");
    expect(nextPendingEnrollmentId(rows, "b")).toBe("c");
    expect(nextPendingEnrollmentId(rows, "c")).toBe(null);
  });
  it("treats draft as pending", () => {
    expect(isPendingGradeStatus("draft")).toBe(true);
    expect(isPendingGradeStatus(null)).toBe(true);
    expect(isPendingGradeStatus("published")).toBe(false);
  });
});

describe("countAssessmentRosterStatuses", () => {
  it("splits published/draft/pending", () => {
    expect(
      countAssessmentRosterStatuses([
        { gradeStatus: "published" },
        { gradeStatus: "draft" },
        { gradeStatus: null },
        { gradeStatus: null },
      ]),
    ).toEqual({ published: 1, draft: 1, pending: 2 });
  });
});
