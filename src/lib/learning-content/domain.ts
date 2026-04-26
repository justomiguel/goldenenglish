import type {
  DetachedLearningRouteStep,
  LearningAssessmentGradingMode,
  LiveLessonCoverageStatus,
  MiniTestAnswer,
  MiniTestQuestion,
  QuestionSnapshot,
  QuestionSnapshotSource,
  StudentLearningReadinessStatus,
  TemplateRouteStepSource,
} from "@/lib/learning-content/types";

export function cloneTemplateIntoLearningRouteStep(source: TemplateRouteStepSource): DetachedLearningRouteStep {
  return {
    contentTemplateId: source.contentTemplateId,
    title: source.title,
    bodyHtml: source.bodyHtml,
    sortOrder: source.sortOrder,
    stepKind: source.stepKind ?? "lesson",
    isRequired: source.isRequired ?? true,
  };
}

export function linkLiveLessonToRouteSteps(routeStepIds: string[]): {
  coverageStatus: LiveLessonCoverageStatus;
  routeStepIds: string[];
} {
  const unique = [...new Set(routeStepIds.filter(Boolean))];
  if (unique.length === 0) return { coverageStatus: "extra", routeStepIds: [] };
  if (unique.length === 1) return { coverageStatus: "as_planned", routeStepIds: unique };
  return { coverageStatus: "merged", routeStepIds: unique };
}

export function deriveAttemptOutcome(input: {
  gradingMode: LearningAssessmentGradingMode;
  score?: number | null;
  passingScore?: number | null;
  passed?: boolean | null;
  requiredForCompletion: boolean;
}): { passed: boolean | null; blocksCompletion: boolean } {
  const passed =
    input.gradingMode === "numeric"
      ? input.score != null && input.passingScore != null
        ? input.score >= input.passingScore
        : null
      : input.gradingMode === "pass_fail"
        ? input.passed ?? null
        : null;
  return {
    passed,
    blocksCompletion: input.requiredForCompletion && passed === false,
  };
}

export function buildQuestionSnapshot(source: QuestionSnapshotSource): QuestionSnapshot {
  return {
    questionId: source.id,
    prompt: source.prompt,
    questionType: source.questionType,
    options: structuredClone(source.options),
    correctAnswer: structuredClone(source.correctAnswer),
  };
}

function normalizeTrueFalse(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "t", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "f", "no", "n", "0"].includes(normalized)) return false;
  return null;
}

export function evaluateTrueFalseMiniTest(input: {
  questions: MiniTestQuestion[];
  answers: MiniTestAnswer[];
  passingScore?: number | null;
}): {
  score: number;
  passed: boolean;
  questionSnapshots: QuestionSnapshot[];
  correctCount: number;
} {
  const answersByQuestion = new Map(input.answers.map((item) => [item.questionId, item.answer]));
  const eligibleQuestions = input.questions.filter((question) => question.questionType === "true_false");
  if (eligibleQuestions.length === 0) throw new Error("mini_test_requires_true_false_questions");

  const correctCount = eligibleQuestions.reduce((total, question) => {
    const expected = normalizeTrueFalse(question.correctAnswer);
    const actual = normalizeTrueFalse(answersByQuestion.get(question.id));
    return expected !== null && actual === expected ? total + 1 : total;
  }, 0);
  const score = Math.round((correctCount / eligibleQuestions.length) * 100);
  return {
    score,
    passed: score >= (input.passingScore ?? 100),
    questionSnapshots: eligibleQuestions.map(buildQuestionSnapshot),
    correctCount,
  };
}

export function resolveReadinessDecision(input: {
  teacherApproved: boolean | null;
  failedAttempt: boolean;
}): StudentLearningReadinessStatus {
  if (input.teacherApproved == null) {
    throw new Error("readiness_requires_teacher_decision");
  }
  if (input.teacherApproved && input.failedAttempt) return "teacher_override";
  return input.teacherApproved ? "ready" : "needs_support";
}
