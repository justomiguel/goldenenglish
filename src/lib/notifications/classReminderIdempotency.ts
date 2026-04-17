import type { ClassReminderJobKind } from "@/types/classReminders";

export function buildClassReminderIdempotencyKey(input: {
  sectionEnrollmentId: string;
  occurrenceStartMs: number;
  kind: ClassReminderJobKind;
}): string {
  return `enr:${input.sectionEnrollmentId}:occ:${input.occurrenceStartMs}:${input.kind}`;
}
