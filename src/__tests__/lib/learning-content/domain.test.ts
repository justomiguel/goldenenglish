/**
 * REGRESSION CHECK: content planning is the long-lived academic contract. These
 * pure rules protect detached copies, live-class coverage, assessment scoring,
 * question snapshots, and explicit teacher readiness decisions.
 */
import { describe, expect, it } from "vitest";
import {
  buildQuestionSnapshot,
  cloneTemplateIntoLearningRouteStep,
  deriveAttemptOutcome,
  evaluateTrueFalseMiniTest,
  linkLiveLessonToRouteSteps,
  resolveReadinessDecision,
} from "@/lib/learning-content";

describe("learning content domain", () => {
  it("copies repository content into a detached learning route step", () => {
    const step = cloneTemplateIntoLearningRouteStep({
      contentTemplateId: "template-1",
      title: "Present simple",
      bodyHtml: "<p>Global</p>",
      sortOrder: 2,
    });
    expect(step).toEqual({
      contentTemplateId: "template-1",
      title: "Present simple",
      bodyHtml: "<p>Global</p>",
      sortOrder: 2,
      stepKind: "lesson",
      isRequired: true,
    });
    step.title = "Section-specific title";
    expect(step.title).not.toBe("Present simple");
  });

  it("allows one live class to merge multiple route steps", () => {
    expect(linkLiveLessonToRouteSteps(["a", "b"])).toEqual({
      coverageStatus: "merged",
      routeStepIds: ["a", "b"],
    });
  });

  it("does not block progress when a mini-test fails", () => {
    const outcome = deriveAttemptOutcome({
      gradingMode: "numeric",
      score: 40,
      passingScore: 70,
      requiredForCompletion: false,
    });
    expect(outcome).toEqual({ passed: false, blocksCompletion: false });
  });

  it("stores question snapshots for historical attempts", () => {
    const snapshot = buildQuestionSnapshot({
      id: "question-1",
      prompt: "The sky is blue.",
      questionType: "true_false",
      options: [{ value: true }],
      correctAnswer: true,
    });
    expect(snapshot).toMatchObject({
      questionId: "question-1",
      prompt: "The sky is blue.",
      questionType: "true_false",
    });
  });

  it("requires explicit teacher readiness decisions", () => {
    expect(() => resolveReadinessDecision({ teacherApproved: null, failedAttempt: true })).toThrow(
      "readiness_requires_teacher_decision",
    );
    expect(resolveReadinessDecision({ teacherApproved: true, failedAttempt: true })).toBe("teacher_override");
  });

  it("evaluates true/false mini-tests and snapshots questions", () => {
    const result = evaluateTrueFalseMiniTest({
      passingScore: 70,
      questions: [
        {
          id: "q1",
          prompt: "English has articles.",
          questionType: "true_false",
          options: [true, false],
          correctAnswer: true,
        },
        {
          id: "q2",
          prompt: "Present simple always uses will.",
          questionType: "true_false",
          options: [true, false],
          correctAnswer: false,
        },
      ],
      answers: [
        { questionId: "q1", answer: "true" },
        { questionId: "q2", answer: true },
      ],
    });

    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
    expect(result.questionSnapshots).toHaveLength(2);
    expect(result.questionSnapshots[0].questionId).toBe("q1");
  });
});
