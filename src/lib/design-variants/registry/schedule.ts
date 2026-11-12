import type { SectionVariant } from "@/lib/design-variants/sectionVariant";
import { schedulePropsSchema } from "@/variants/schedule/scheduleProps";

const shared = {
  slot: "schedule" as const,
  major: 1,
  patch: 0,
  propsSchema: schedulePropsSchema,
  editorFields: [],
  consumesTokens: ["color.foreground", "color.muted.foreground", "color.border"] as const,
  interactive: false,
};

export const SCHEDULE_VARIANTS: readonly SectionVariant<unknown>[] = [
  { ...shared, id: "schedule.rows", web: () => import("@/variants/schedule/rows/v1/Web") },
  { ...shared, id: "schedule.rule", web: () => import("@/variants/schedule/rule/v1/Web") },
  { ...shared, id: "schedule.prospectus", web: () => import("@/variants/schedule/prospectus/v1/Web") },
  { ...shared, id: "schedule.recital", web: () => import("@/variants/schedule/recital/v1/Web") },
  { ...shared, id: "schedule.steps", web: () => import("@/variants/schedule/steps/v1/Web") },
];
