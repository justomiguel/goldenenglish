import type { SectionScheduleSlot } from "@/types/academics";

/** The section behind a public enrollment link, as the form and surfaces receive it. */
export interface SectionEnrollmentLinkContext {
  token: string;
  sectionId: string;
  sectionName: string;
  cohortName: string;
  scheduleSlots: SectionScheduleSlot[];
  seatsRemaining: number | null;
  referenceImagePath: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cheap shape gate so a junk path never reaches the database. */
export function isSectionEnrollmentLinkToken(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
