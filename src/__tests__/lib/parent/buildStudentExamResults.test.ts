// REGRESSION CHECK: this is the module that makes a teacher's evaluación visible to a family before
// it is graded. Two invariants: an exam without a PUBLISHED grade must never show a score (drafts are
// readable under RLS, so silence here is the publish gate), and an exam must never disappear just
// because nobody graded it — that was the original bug.

import { describe, expect, it } from "vitest";
import { buildStudentExamResults } from "@/lib/parent/buildStudentExamResults";

const TODAY = new Date("2026-08-07T12:00:00Z");

const SECTION_BY_COHORT = new Map([["cohort-1", "B1 — Group A"]]);

function assessment(overrides: Partial<Parameters<typeof buildStudentExamResults>[0]["assessments"][number]> = {}) {
  return {
    id: "asm-1",
    cohortId: "cohort-1",
    name: "Unit 3 exam",
    examOn: "2026-08-05",
    maxScore: 10,
    ...overrides,
  };
}

describe("buildStudentExamResults", () => {
  it("shows a published grade as a score", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment()],
      gradesByAssessmentId: new Map([
        ["asm-1", { score: 8, hasTeacherFeedback: true }],
      ]),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam).toMatchObject({
      id: "asm-1",
      name: "Unit 3 exam",
      sectionName: "B1 — Group A",
      score: 8,
      maxScore: 10,
      hasTeacherFeedback: true,
      state: "graded",
    });
  });

  it("keeps an exam whose date passed without a published grade, with no score", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment({ examOn: "2026-08-01" })],
      gradesByAssessmentId: new Map(),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam?.state).toBe("pending");
    expect(exam?.score).toBeNull();
    expect(exam?.hasTeacherFeedback).toBe(false);
  });

  it("marks an exam still ahead as upcoming", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment({ examOn: "2026-08-20" })],
      gradesByAssessmentId: new Map(),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam?.state).toBe("upcoming");
  });

  it("treats an exam dated today as pending, not upcoming", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment({ examOn: "2026-08-07" })],
      gradesByAssessmentId: new Map(),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam?.state).toBe("pending");
  });

  it("prefers the published grade even for an exam in the future", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment({ examOn: "2026-08-20" })],
      gradesByAssessmentId: new Map([["asm-1", { score: 9, hasTeacherFeedback: false }]]),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam?.state).toBe("graded");
    expect(exam?.score).toBe(9);
  });

  it("orders by exam date, newest first", () => {
    const exams = buildStudentExamResults({
      assessments: [
        assessment({ id: "old", examOn: "2026-05-01" }),
        assessment({ id: "new", examOn: "2026-08-20" }),
        assessment({ id: "mid", examOn: "2026-07-01" }),
      ],
      gradesByAssessmentId: new Map(),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exams.map((exam) => exam.id)).toEqual(["new", "mid", "old"]);
  });

  it("falls back to an empty section name for an unknown cohort", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment({ cohortId: "other" })],
      gradesByAssessmentId: new Map(),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam?.sectionName).toBe("");
  });

  it("keeps the exam when the max score is unusable", () => {
    const [exam] = buildStudentExamResults({
      assessments: [assessment({ maxScore: 0 })],
      gradesByAssessmentId: new Map([["asm-1", { score: 8, hasTeacherFeedback: false }]]),
      sectionNameByCohortId: SECTION_BY_COHORT,
      now: TODAY,
    });

    expect(exam?.maxScore).toBeNull();
    expect(exam?.score).toBe(8);
  });

  it("returns nothing when there are no assessments", () => {
    expect(
      buildStudentExamResults({
        assessments: [],
        gradesByAssessmentId: new Map(),
        sectionNameByCohortId: SECTION_BY_COHORT,
        now: TODAY,
      }),
    ).toEqual([]);
  });
});
