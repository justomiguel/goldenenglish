import { describe, expect, it } from "vitest";
import { buildParentChildMetrics } from "@/lib/parent/buildParentChildMetrics";
import type { ParentAttendanceSectionSummary } from "@/lib/parent/buildParentAttendanceSectionSummaries";
import type { StudentExamResult } from "@/types/studentExams";
import type { StudentLearningTaskRow } from "@/types/learningTasks";

const NOW = new Date("2026-03-10T12:00:00.000Z");

function summary(over: Partial<ParentAttendanceSectionSummary> = {}): ParentAttendanceSectionSummary {
  return {
    studentId: "stu-1",
    studentName: "Ana",
    sectionId: "sec-1",
    sectionName: "Teens A1",
    monthPercent: 90,
    sessionsThisMonth: 8,
    requiredMinPercent: 75,
    level: "ok",
    ...over,
  };
}

function exam(over: Partial<StudentExamResult> = {}): StudentExamResult {
  return {
    id: "ex-1",
    name: "Unit 1",
    sectionName: "Teens A1",
    examOn: "2026-03-01",
    maxScore: 100,
    score: 80,
    hasTeacherFeedback: false,
    state: "graded",
    ...over,
  };
}

function task(over: Partial<StudentLearningTaskRow> = {}): StudentLearningTaskRow {
  return {
    taskInstanceId: "t-1",
    title: "Homework",
    sectionName: "Teens A1",
    dueAt: "2026-03-20T12:00:00.000Z",
    status: "NOT_OPENED",
    ...over,
  };
}

describe("buildParentChildMetrics", () => {
  it("reports the active section's month percent and flags it below the required minimum", () => {
    const metrics = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-1",
      attendanceSummaries: [summary({ monthPercent: 60 }), summary({ sectionId: "sec-2", monthPercent: 95 })],
      exams: [],
      tasks: [],
    });

    const attendance = metrics.find((m) => m.id === "attendance")!;
    expect(attendance.percent).toBe(60);
    expect(attendance.tone).toBe("warn");
  });

  it("marks attendance at or above the minimum as good", () => {
    const [attendance] = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-1",
      attendanceSummaries: [summary({ monthPercent: 75 })],
      exams: [],
      tasks: [],
    });

    expect(attendance.tone).toBe("good");
  });

  it("leaves attendance empty when the section has no summary", () => {
    const [attendance] = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-9",
      attendanceSummaries: [summary()],
      exams: [],
      tasks: [],
    });

    expect(attendance.percent).toBeNull();
    expect(attendance.tone).toBe("neutral");
  });

  it("averages only graded exams, as a percentage of each max score", () => {
    const metrics = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-1",
      attendanceSummaries: [],
      exams: [
        exam({ id: "a", score: 80, maxScore: 100 }),
        exam({ id: "b", score: 5, maxScore: 10 }),
        exam({ id: "c", score: null }),
        exam({ id: "d", score: 10, maxScore: 0 }),
      ],
      tasks: [],
    });

    const average = metrics.find((m) => m.id === "average")!;
    expect(average.percent).toBe(65);
  });

  it("has no average when nothing is graded yet", () => {
    const metrics = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-1",
      attendanceSummaries: [],
      exams: [exam({ score: null })],
      tasks: [],
    });

    expect(metrics.find((m) => m.id === "average")!.percent).toBeNull();
  });

  it("counts unfinished tasks and warns only when one is already overdue", () => {
    const notOverdue = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-1",
      attendanceSummaries: [],
      exams: [],
      tasks: [
        task({ taskInstanceId: "a", status: "NOT_OPENED" }),
        task({ taskInstanceId: "b", status: "OPENED" }),
        task({ taskInstanceId: "c", status: "COMPLETED" }),
        task({ taskInstanceId: "d", status: "COMPLETED_LATE" }),
      ],
    }).find((m) => m.id === "pendingTasks")!;

    expect(notOverdue.count).toBe(2);
    expect(notOverdue.tone).toBe("neutral");

    const overdue = buildParentChildMetrics({
      now: NOW,
      sectionId: "sec-1",
      attendanceSummaries: [],
      exams: [],
      tasks: [task({ dueAt: "2026-03-01T12:00:00.000Z" })],
    }).find((m) => m.id === "pendingTasks")!;

    expect(overdue.tone).toBe("warn");
  });

  it("returns the three metrics in a stable order", () => {
    const metrics = buildParentChildMetrics({
      now: NOW,
      sectionId: null,
      attendanceSummaries: [],
      exams: [],
      tasks: [],
    });

    expect(metrics.map((m) => m.id)).toEqual(["attendance", "average", "pendingTasks"]);
  });
});
