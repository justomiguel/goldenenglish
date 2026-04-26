import { z } from "zod";

export const LearningRouteSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(180),
  teacherObjectives: z.string().trim().max(12000),
  generalScope: z.string().trim().max(12000),
  evaluationCriteria: z.string().trim().max(12000),
});

export const DeleteLearningRouteSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid(),
});

export const SectionLearningRouteSchema = z
  .object({
    locale: z.string().min(2).max(8),
    cohortId: z.string().uuid(),
    sectionId: z.string().uuid(),
    learningRouteId: z.string().uuid().nullable(),
    mode: z.enum(["route", "free_flow"]),
  })
  .refine(
    (value) =>
      (value.mode === "free_flow" && value.learningRouteId === null) ||
      (value.mode === "route" && value.learningRouteId !== null),
    { path: ["learningRouteId"] },
  );

export const RouteStepSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid(),
  contentTemplateId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  stepKind: z.enum(["lesson", "unit", "review", "exam_prep", "remediation"]).default("lesson"),
});

export const QuestionSchema = z.object({
  sectionId: z.string().uuid().optional(),
  prompt: z.string().trim().min(1).max(4000),
  questionType: z.enum(["true_false", "multiple_choice", "short_answer", "rubric", "oral_check"]),
  skill: z.string().trim().max(80).optional(),
  cefrLevel: z.string().trim().max(40).optional(),
});

export const AssessmentSchema = z.object({
  sectionId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  assessmentKind: z.enum(["entry", "exit", "formative", "mini_test", "diagnostic"]),
  gradingMode: z.enum(["numeric", "pass_fail", "diagnostic", "rubric", "manual_feedback"]),
  instructions: z.string().trim().max(12000).optional(),
});

export const LearningRouteGraphNodeSchema = z.object({
  id: z.string().uuid(),
  contentTemplateId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  stepKind: z.enum(["lesson", "unit", "review", "exam_prep", "remediation"]).default("lesson"),
  isRequired: z.boolean().default(true),
  positionX: z.coerce.number().min(-99999).max(99999),
  positionY: z.coerce.number().min(-99999).max(99999),
});

export const LearningRouteGraphEdgeSchema = z.object({
  id: z.string().uuid(),
  fromStepId: z.string().uuid(),
  toStepId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  label: z.string().trim().max(180).default(""),
  conditionKind: z.string().trim().max(80).default("default"),
});

export const LearningRouteGraphCheckpointSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  edgeId: z.string().uuid(),
  assessmentId: z.string().uuid().nullable().optional(),
  enabled: z.boolean().default(false),
  title: z.string().trim().max(180).default(""),
  assessmentKind: z.enum(["entry", "exit", "formative", "mini_test", "diagnostic"]).default("mini_test"),
  gradingMode: z.enum(["numeric", "pass_fail", "diagnostic", "rubric", "manual_feedback"]).default("diagnostic"),
  instructions: z.string().trim().max(12000).default(""),
  isRequired: z.boolean().default(false),
  isPriority: z.boolean().default(false),
  blocksProgress: z.boolean().default(false),
  maxScore: z.coerce.number().positive().max(1000).nullable().optional(),
  passingScore: z.coerce.number().min(0).max(1000).nullable().optional(),
  weight: z.coerce.number().min(0).max(100).nullable().optional(),
}).refine((value) => !value.enabled || value.title.length > 0, { path: ["title"] });

export const LearningRouteGraphSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid(),
  nodes: z.array(LearningRouteGraphNodeSchema).max(120),
  edges: z.array(LearningRouteGraphEdgeSchema).max(180),
  checkpoints: z.array(LearningRouteGraphCheckpointSchema).max(180),
}).refine((value) => {
  const nodeIds = new Set(value.nodes.map((node) => node.id));
  return value.edges.every((edge) => nodeIds.has(edge.fromStepId) && nodeIds.has(edge.toStepId));
}, { path: ["edges"] }).refine((value) => {
  const edgeIds = new Set(value.edges.map((edge) => edge.id));
  return value.checkpoints.every((checkpoint) => edgeIds.has(checkpoint.edgeId));
}, { path: ["checkpoints"] });
