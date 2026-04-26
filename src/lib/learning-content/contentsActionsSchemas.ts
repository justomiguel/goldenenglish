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
