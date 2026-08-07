import { describe, it, expect } from "vitest";
import {
  LEARNING_ATTEMPT_MAX_SCORE,
  collectFeedbackTeacherIds,
  mapCohortGradeFeedbackRows,
  mapLearningAttemptFeedbackRows,
  type CohortGradeFeedbackRow,
  type FeedbackSectionMeta,
  type LearningAttemptFeedbackRow,
  type ParentFeedbackMappingContext,
} from "@/lib/parent/mapParentFeedbackRows";

// REGRESSION CHECK: PostgREST returns embedded relations either as an object or as a
// single-element array depending on the join shape. Both forms must keep mapping, otherwise
// feedback silently disappears for one of the two sources.

const SECTION: FeedbackSectionMeta = { name: "B1 — Group A", teacherId: "tea-1" };

function context(
  overrides: Partial<ParentFeedbackMappingContext> = {},
): ParentFeedbackMappingContext {
  return {
    studentId: "stu-1",
    childLabel: "Adams Zara",
    sectionByEnrollmentId: new Map([["enr-1", SECTION]]),
    sectionById: new Map([["sec-1", SECTION]]),
    teacherNameById: new Map([["tea-1", "Ruiz Marta"]]),
    ...overrides,
  };
}

function gradeRow(overrides: Partial<CohortGradeFeedbackRow> = {}): CohortGradeFeedbackRow {
  return {
    enrollment_id: "enr-1",
    assessment_id: "asm-1",
    score: "82.00",
    teacher_feedback: "Good work.",
    updated_at: "2026-08-05T09:30:00Z",
    cohort_assessments: { name: "Unit 3 exam", max_score: "100" },
    ...overrides,
  };
}

function attemptRow(
  overrides: Partial<LearningAttemptFeedbackRow> = {},
): LearningAttemptFeedbackRow {
  return {
    id: "att-1",
    score: 70,
    teacher_feedback: "Nice listening.",
    reviewed_at: "2026-08-04T10:00:00Z",
    updated_at: "2026-08-04T12:00:00Z",
    reviewed_by: "tea-1",
    learning_assessments: { title: "Listening check", section_id: "sec-1" },
    ...overrides,
  };
}

describe("mapCohortGradeFeedbackRows", () => {
  it("maps a row to a timeline entry with section and teacher context", () => {
    expect(mapCohortGradeFeedbackRows([gradeRow()], context())[0]).toEqual({
      id: "assessment:enr-1:asm-1",
      source: "assessment",
      studentId: "stu-1",
      childLabel: "Adams Zara",
      title: "Unit 3 exam",
      contextLabel: "B1 — Group A",
      teacherName: "Ruiz Marta",
      occurredOn: "2026-08-05",
      score: 82,
      maxScore: 100,
      feedback: "Good work.",
    });
  });

  it("accepts the array form of the embedded assessment", () => {
    const rows = mapCohortGradeFeedbackRows(
      [gradeRow({ cohort_assessments: [{ name: "Unit 3 exam", max_score: 100 }] })],
      context(),
    );

    expect(rows[0].title).toBe("Unit 3 exam");
  });

  it("drops rows whose assessment join came back empty", () => {
    expect(mapCohortGradeFeedbackRows([gradeRow({ cohort_assessments: null })], context())).toEqual(
      [],
    );
  });

  it("degrades gracefully when the section or teacher is unknown", () => {
    const rows = mapCohortGradeFeedbackRows(
      [gradeRow()],
      context({ sectionByEnrollmentId: new Map(), teacherNameById: new Map() }),
    );

    expect(rows[0].contextLabel).toBe("");
    expect(rows[0].teacherName).toBeNull();
  });
});

describe("mapLearningAttemptFeedbackRows", () => {
  it("prefers the review timestamp over the row update timestamp", () => {
    expect(mapLearningAttemptFeedbackRows([attemptRow()], context())[0].occurredOn).toBe(
      "2026-08-04",
    );
  });

  it("falls back to the update timestamp when the attempt has no review date", () => {
    const rows = mapLearningAttemptFeedbackRows(
      [attemptRow({ reviewed_at: null, updated_at: "2026-07-02T08:00:00Z" })],
      context(),
    );

    expect(rows[0].occurredOn).toBe("2026-07-02");
  });

  it("uses the schema-constrained maximum only when a score exists", () => {
    expect(mapLearningAttemptFeedbackRows([attemptRow()], context())[0].maxScore).toBe(
      LEARNING_ATTEMPT_MAX_SCORE,
    );
    expect(
      mapLearningAttemptFeedbackRows([attemptRow({ score: null })], context())[0].maxScore,
    ).toBeNull();
  });

  it("credits the reviewing teacher ahead of the section teacher", () => {
    const rows = mapLearningAttemptFeedbackRows(
      [attemptRow({ reviewed_by: "tea-2" })],
      context({
        teacherNameById: new Map([
          ["tea-1", "Ruiz Marta"],
          ["tea-2", "Silva Diego"],
        ]),
      }),
    );

    expect(rows[0].teacherName).toBe("Silva Diego");
  });
});

describe("collectFeedbackTeacherIds", () => {
  it("gathers section teachers and reviewers exactly once", () => {
    const ids = collectFeedbackTeacherIds({
      gradeRows: [gradeRow()],
      attemptRows: [attemptRow(), attemptRow({ id: "att-2", reviewed_by: "tea-9" })],
      sectionByEnrollmentId: new Map([["enr-1", SECTION]]),
      sectionById: new Map([["sec-1", SECTION]]),
    });

    expect(ids.sort()).toEqual(["tea-1", "tea-9"]);
  });

  it("returns nothing when no teacher can be resolved", () => {
    expect(
      collectFeedbackTeacherIds({
        gradeRows: [gradeRow()],
        attemptRows: [attemptRow({ reviewed_by: null, learning_assessments: null })],
        sectionByEnrollmentId: new Map(),
        sectionById: new Map(),
      }),
    ).toEqual([]);
  });
});
