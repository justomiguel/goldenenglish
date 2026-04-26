import type { LearningRouteModel } from "@/types/learningContent";

export type RouteRow = {
  id: string;
  title: string;
  teacher_objectives: string;
  general_scope: string;
  evaluation_criteria: string;
  status: "draft" | "active" | "archived";
};

export type AssignmentRow = {
  id: string;
  section_id: string;
  learning_route_id: string | null;
  mode: "route" | "free_flow";
  learning_routes?: RouteRow | RouteRow[] | null;
};

export function firstRelation<T>(raw: T | T[] | null | undefined): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
}

export function mapRouteRowToModel(row: RouteRow): LearningRouteModel {
  return {
    id: row.id,
    title: row.title,
    teacherObjectives: row.teacher_objectives,
    generalScope: row.general_scope,
    evaluationCriteria: row.evaluation_criteria,
    status: row.status,
  };
}
