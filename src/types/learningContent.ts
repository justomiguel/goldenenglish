import type {
  LearningAssessmentGradingMode,
  StudentLearningReadinessStatus,
} from "@/lib/learning-content/types";

export type ContentSectionOption = {
  id: string;
  label: string;
  cohortName: string;
};

export type LearningRouteModel = {
  id: string | null;
  title: string;
  teacherObjectives: string;
  generalScope: string;
  evaluationCriteria: string;
  status: "draft" | "active" | "archived";
};

export type LearningRouteStepModel = {
  id: string;
  contentTemplateId: string;
  contentTitle: string;
  title: string;
  sortOrder: number;
  stepKind: string;
  isRequired: boolean;
  positionX: number;
  positionY: number;
};

export type LearningRouteEdgeModel = {
  id: string;
  fromStepId: string;
  toStepId: string;
  sortOrder: number;
  label: string;
  conditionKind: string;
};

export type LearningRouteCheckpointModel = {
  id: string;
  edgeId: string;
  assessmentId: string | null;
  assessmentTitle: string | null;
  assessmentKind: string | null;
  gradingMode: LearningAssessmentGradingMode | null;
  isRequired: boolean;
  isPriority: boolean;
  blocksProgress: boolean;
  contributesToGradebook: boolean;
  maxScore: number | null;
  passingScore: number | null;
  weight: number | null;
};

export type LearningRouteContentTemplateOption = {
  id: string;
  title: string;
  description: string;
};

export type SectionLearningRouteAssignment = {
  id: string | null;
  sectionId: string;
  learningRouteId: string | null;
  mode: "route" | "free_flow";
};

export type QuestionBankItemModel = {
  id: string;
  prompt: string;
  questionType: string;
  skill: string | null;
  cefrLevel: string | null;
};

export type LearningAssessmentModel = {
  id: string;
  title: string;
  assessmentKind: string;
  gradingMode: LearningAssessmentGradingMode;
};

export type LearningFeedbackRow = {
  id: string;
  title: string;
  gradingMode: LearningAssessmentGradingMode;
  score: number | null;
  passed: boolean | null;
  diagnosticLabel: string | null;
  teacherFeedback: string;
  readinessStatus: StudentLearningReadinessStatus | null;
};

export type StudentMiniTestQuestion = {
  id: string;
  prompt: string;
  questionType: "true_false";
};

export type StudentMiniTestAssessment = {
  id: string;
  title: string;
  assessmentKind: string;
  gradingMode: LearningAssessmentGradingMode;
  sectionName: string;
  latestAttemptStatus: string | null;
  questions: StudentMiniTestQuestion[];
};

export type TeacherAssessmentAttemptReview = {
  id: string;
  studentId: string;
  studentLabel: string;
  assessmentTitle: string;
  score: number | null;
  passed: boolean | null;
  status: string;
  teacherFeedback: string;
};

export type SectionContentHealth = {
  missingObjectives: boolean;
  missingEntryAssessment: boolean;
  missingExitAssessment: boolean;
  needsSupportCount: number;
  teacherOverrideCount: number;
};
