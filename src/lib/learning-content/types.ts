export type LearningRouteStepKind = "lesson" | "unit" | "review" | "exam_prep" | "remediation";
export type LiveLessonCoverageStatus = "as_planned" | "merged" | "split" | "skipped" | "remediation" | "extra";
export type QuestionBankItemType = "true_false" | "multiple_choice" | "short_answer" | "rubric" | "oral_check";
export type LearningAssessmentGradingMode = "numeric" | "pass_fail" | "diagnostic" | "rubric" | "manual_feedback";
export type StudentLearningReadinessStatus = "ready" | "needs_support" | "teacher_override";

export type TemplateRouteStepSource = {
  contentTemplateId: string;
  title: string;
  bodyHtml: string;
  sortOrder: number;
  stepKind?: LearningRouteStepKind;
  isRequired?: boolean;
};

export type DetachedLearningRouteStep = {
  contentTemplateId: string;
  title: string;
  bodyHtml: string;
  sortOrder: number;
  stepKind: LearningRouteStepKind;
  isRequired: boolean;
};

export type QuestionSnapshotSource = {
  id: string;
  prompt: string;
  questionType: QuestionBankItemType;
  options: unknown;
  correctAnswer: unknown;
};

export type QuestionSnapshot = {
  questionId: string;
  prompt: string;
  questionType: QuestionBankItemType;
  options: unknown;
  correctAnswer: unknown;
};

export type MiniTestQuestion = QuestionSnapshotSource & {
  points?: number | null;
};

export type MiniTestAnswer = {
  questionId: string;
  answer: unknown;
};
