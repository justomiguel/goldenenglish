import type {
  LearningAssessmentModel,
  LearningRouteCheckpointModel,
  LearningRouteContentTemplateOption,
  LearningRouteEdgeModel,
  LearningRouteModel,
  LearningRouteStepModel,
  QuestionBankItemModel,
  SectionLearningRouteAssignment,
  SectionContentHealth,
} from "@/types/learningContent";

export type LearningRouteWorkspace = {
  route: LearningRouteModel | null;
  routeSteps: LearningRouteStepModel[];
  routeEdges: LearningRouteEdgeModel[];
  routeCheckpoints: LearningRouteCheckpointModel[];
  contentTemplates: LearningRouteContentTemplateOption[];
  questions: QuestionBankItemModel[];
  assessments: LearningAssessmentModel[];
  health: SectionContentHealth;
  assignment?: SectionLearningRouteAssignment | null;
};
