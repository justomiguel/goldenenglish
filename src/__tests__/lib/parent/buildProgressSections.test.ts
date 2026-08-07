// REGRESSION CHECK: this module decides which Progress sections exist at all. Two invariants must
// not break: (1) a section with no content is never offered, and (2) badges count *earned* rows only,
// because `loadStudentBadgeDisplayRows` also returns the locked catalog, so `rows.length` is always
// truthy. Relaxing either one brings back dead-end sections.

import { describe, expect, it } from "vitest";
import {
  PROGRESS_SECTION_ASSESSMENTS,
  PROGRESS_SECTION_BADGES,
  PROGRESS_SECTION_EXAMS,
  PROGRESS_SECTION_FEEDBACK,
  PROGRESS_SECTION_TASKS,
  buildProgressSections,
} from "@/lib/parent/buildProgressSections";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentBadgeRowModel } from "@/types/studentBadges";
import type { StudentExamResult } from "@/types/studentExams";

function exam(overrides: Partial<StudentExamResult> = {}): StudentExamResult {
  return {
    id: "asm-1",
    name: "Unit 3 exam",
    sectionName: "B1 — Group A",
    examOn: "2026-08-05",
    maxScore: 10,
    score: null,
    hasTeacherFeedback: false,
    state: "pending",
    ...overrides,
  };
}

function task(overrides: Partial<StudentLearningTaskRow> = {}): StudentLearningTaskRow {
  return {
    taskInstanceId: "task-1",
    progressId: "prog-1",
    title: "Unit 3 reading",
    bodyHtml: "<p>Read</p>",
    sectionName: "B1 — Group A",
    startAt: "2026-08-01",
    dueAt: "2026-08-10",
    status: "NOT_OPENED",
    openedAt: null,
    completedAt: null,
    assets: [],
    ...overrides,
  };
}

function miniTest(overrides: Partial<StudentMiniTestAssessment> = {}): StudentMiniTestAssessment {
  return {
    id: "mt-1",
    title: "Present perfect",
    assessmentKind: "mini_test",
    gradingMode: "numeric",
    sectionName: "B1 — Group A",
    latestAttemptStatus: null,
    questions: [],
    ...overrides,
  };
}

function badge(overrides: Partial<StudentBadgeRowModel> = {}): StudentBadgeRowModel {
  return {
    id: "badge-1",
    badgeCode: "first_task",
    earnedAt: "2026-07-30",
    shareUrl: "https://example.test/b/x",
    locked: false,
    progress: null,
    ...overrides,
  };
}

const emptyTimeline: ParentFeedbackTimeline = { items: [], newCount: 0 };

function timeline(ids: string[]): ParentFeedbackTimeline {
  return {
    items: ids.map((id) => ({
      id,
      source: "assessment" as const,
      studentId: "s1",
      childLabel: "Ana",
      title: "Exam",
      contextLabel: "B1",
      teacherName: null,
      occurredOn: "2026-08-05",
      score: null,
      maxScore: null,
      feedback: "Great",
      isNew: true,
    })),
    newCount: ids.length,
  };
}

const EMPTY_INPUT = {
  exams: [],
  tasks: [],
  assessments: [],
  feedback: emptyTimeline,
  badgeRows: [],
};

describe("buildProgressSections", () => {
  it("returns no sections when every dataset is empty", () => {
    expect(buildProgressSections(EMPTY_INPUT)).toEqual([]);
  });

  it("omits sections without content and keeps the canonical order", () => {
    const sections = buildProgressSections({
      ...EMPTY_INPUT,
      assessments: [miniTest()],
      feedback: timeline(["f1"]),
    });

    expect(sections.map((s) => s.id)).toEqual([
      PROGRESS_SECTION_ASSESSMENTS,
      PROGRESS_SECTION_FEEDBACK,
    ]);
  });

  it("offers exams first, since that is what families come for", () => {
    const sections = buildProgressSections({
      ...EMPTY_INPUT,
      exams: [exam()],
      tasks: [task()],
      feedback: timeline(["f1"]),
    });

    expect(sections[0]?.id).toBe(PROGRESS_SECTION_EXAMS);
  });

  it("counts an exam nobody has graded yet, so a new evaluación is never invisible", () => {
    const sections = buildProgressSections({ ...EMPTY_INPUT, exams: [exam({ state: "upcoming" })] });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.count).toBe(1);
  });

  it("folds the exam state into the key so a published score reads as news", () => {
    const before = buildProgressSections({ ...EMPTY_INPUT, exams: [exam()] });
    const after = buildProgressSections({
      ...EMPTY_INPUT,
      exams: [exam({ state: "graded", score: 8 })],
    });

    expect(before[0]?.itemKeys).not.toEqual(after[0]?.itemKeys);
  });

  it("counts every dataset and exposes one key per item", () => {
    const sections = buildProgressSections({
      exams: [exam()],
      tasks: [task(), task({ taskInstanceId: "task-2" })],
      assessments: [miniTest()],
      feedback: timeline(["f1", "f2", "f3"]),
      badgeRows: [badge()],
    });

    const byId = new Map(sections.map((s) => [s.id, s]));
    expect(byId.get(PROGRESS_SECTION_EXAMS)?.count).toBe(1);
    expect(byId.get(PROGRESS_SECTION_TASKS)?.count).toBe(2);
    expect(byId.get(PROGRESS_SECTION_TASKS)?.itemKeys).toHaveLength(2);
    expect(byId.get(PROGRESS_SECTION_FEEDBACK)?.count).toBe(3);
    expect(byId.get(PROGRESS_SECTION_FEEDBACK)?.itemKeys).toEqual(["f1", "f2", "f3"]);
    expect(byId.get(PROGRESS_SECTION_BADGES)?.count).toBe(1);
  });

  it("ignores locked badges, which the catalog always returns", () => {
    const sections = buildProgressSections({
      ...EMPTY_INPUT,
      badgeRows: [
        badge({ id: "locked-1", locked: true, earnedAt: null }),
        badge({ id: "locked-2", locked: true, earnedAt: null }),
      ],
    });

    expect(sections).toEqual([]);
  });

  it("counts only the earned badges when the catalog mixes both", () => {
    const sections = buildProgressSections({
      ...EMPTY_INPUT,
      badgeRows: [badge({ id: "earned-1" }), badge({ id: "locked-1", locked: true, earnedAt: null })],
    });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.count).toBe(1);
    expect(sections[0]?.itemKeys).toEqual(["earned-1"]);
  });

  it("folds task status into the key so a graded task reads as news", () => {
    const before = buildProgressSections({ ...EMPTY_INPUT, tasks: [task()] });
    const after = buildProgressSections({
      ...EMPTY_INPUT,
      tasks: [task({ status: "COMPLETED" })],
    });

    expect(before[0]?.itemKeys).not.toEqual(after[0]?.itemKeys);
  });

  it("folds the latest attempt status into the assessment key", () => {
    const before = buildProgressSections({ ...EMPTY_INPUT, assessments: [miniTest()] });
    const after = buildProgressSections({
      ...EMPTY_INPUT,
      assessments: [miniTest({ latestAttemptStatus: "graded" })],
    });

    expect(before[0]?.itemKeys).not.toEqual(after[0]?.itemKeys);
  });
});
