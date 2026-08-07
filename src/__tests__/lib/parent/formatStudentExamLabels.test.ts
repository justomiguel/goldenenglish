import { describe, expect, it } from "vitest";
import {
  buildStudentExamMetaParts,
  formatStudentExamScore,
  studentExamStateHint,
  studentExamStateLabel,
} from "@/lib/parent/formatStudentExamLabels";
import type { StudentExamCopy } from "@/lib/parent/formatStudentExamLabels";

const COPY = {
  title: "Exams",
  lead: "lead",
  listAria: "Exams and scores",
  empty: "empty",
  emptyHint: "empty hint",
  stateGraded: "Graded",
  statePending: "No score yet",
  stateUpcoming: "Upcoming",
  pendingHint: "The teacher has not published the result yet.",
  upcomingHint: "This exam has not been taken yet.",
  scoreLine: "{score} / {max}",
  scoreAria: "Score {score} out of {max}",
  scoreOnlyAria: "Score {score}",
  commentHint: "Includes a teacher comment",
  commentLink: "Read it in Feedback",
} satisfies StudentExamCopy;

describe("formatStudentExamLabels", () => {
  it("names each state", () => {
    expect(studentExamStateLabel("graded", COPY)).toBe("Graded");
    expect(studentExamStateLabel("pending", COPY)).toBe("No score yet");
    expect(studentExamStateLabel("upcoming", COPY)).toBe("Upcoming");
  });

  it("explains why there is no score, and says nothing once there is one", () => {
    expect(studentExamStateHint("pending", COPY)).toBe(COPY.pendingHint);
    expect(studentExamStateHint("upcoming", COPY)).toBe(COPY.upcomingHint);
    expect(studentExamStateHint("graded", COPY)).toBeNull();
  });

  it("renders a score against its maximum", () => {
    expect(formatStudentExamScore({ score: 8, maxScore: 10 }, COPY)).toEqual({
      label: "8 / 10",
      ariaLabel: "Score 8 out of 10",
    });
  });

  it("renders a bare score when the exam has no usable maximum", () => {
    expect(formatStudentExamScore({ score: 8, maxScore: null }, COPY)).toEqual({
      label: "8",
      ariaLabel: "Score 8",
    });
  });

  it("renders nothing without a score", () => {
    expect(formatStudentExamScore({ score: null, maxScore: 10 }, COPY)).toBeNull();
  });

  it("joins section and date, dropping what is missing", () => {
    expect(
      buildStudentExamMetaParts({ sectionName: "B1 — Group A", examOn: "2026-08-05" }, "en-US"),
    ).toEqual(["B1 — Group A", "Aug 5, 2026"]);

    expect(buildStudentExamMetaParts({ sectionName: "  ", examOn: "2026-08-05" }, "en-US")).toEqual([
      "Aug 5, 2026",
    ]);
  });
});
