import { z } from "zod";
import { PORTAL_SPECIAL_CALENDAR_SCOPES, PORTAL_SPECIAL_EVENT_TYPES } from "@/types/portalSpecialCalendar";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hm = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/);

const eventTypeZ = z.enum(PORTAL_SPECIAL_EVENT_TYPES);
const scopeZ = z.enum(PORTAL_SPECIAL_CALENDAR_SCOPES);

const emptyOrUuid = z
  .union([z.literal(""), z.string().uuid()])
  .default("")
  .transform((s) => (s === "" ? null : s));

export const createSpecialCalendarEventSchema = z
  .object({
    locale: z.string().min(2).max(8),
    title: z.string().trim().min(2).max(200),
    notes: z
      .string()
      .max(2000)
      .optional()
      .transform((s) => (s?.trim() ? s.trim() : null)),
    eventDate: isoDate,
    allDay: z.boolean(),
    startTime: hm.optional(),
    endTime: hm.optional(),
    eventType: eventTypeZ,
    calendarScope: scopeZ,
    cohortId: emptyOrUuid,
    sectionId: emptyOrUuid,
    meetingUrl: z
      .string()
      .max(2000)
      .optional()
      .transform((s) => (s?.trim() ? s.trim() : null)),
  })
  .superRefine((data, ctx) => {
    if (data.meetingUrl) {
      try {
        const u = new URL(data.meetingUrl);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          ctx.addIssue({ code: "custom", message: "meeting_url_invalid", path: ["meetingUrl"] });
        }
      } catch {
        ctx.addIssue({ code: "custom", message: "meeting_url_invalid", path: ["meetingUrl"] });
      }
    }
    if (!data.allDay) {
      if (!data.startTime || !data.endTime) {
        ctx.addIssue({ code: "custom", message: "times_required", path: ["startTime"] });
      }
    }
    if (data.calendarScope === "global") {
      if (data.cohortId) ctx.addIssue({ code: "custom", message: "scope_global_ids", path: ["cohortId"] });
      if (data.sectionId) ctx.addIssue({ code: "custom", message: "scope_global_ids", path: ["sectionId"] });
    }
    if (data.calendarScope === "cohort") {
      if (!data.cohortId) ctx.addIssue({ code: "custom", message: "cohort_required", path: ["cohortId"] });
      if (data.sectionId) ctx.addIssue({ code: "custom", message: "cohort_section_exclusive", path: ["sectionId"] });
    }
    if (data.calendarScope === "section") {
      if (!data.sectionId) ctx.addIssue({ code: "custom", message: "section_required", path: ["sectionId"] });
      if (data.cohortId) ctx.addIssue({ code: "custom", message: "cohort_section_exclusive", path: ["cohortId"] });
    }
  });

export const updateSpecialCalendarEventSchema = createSpecialCalendarEventSchema.extend({
  id: z.string().uuid(),
});

export const deleteSpecialCalendarEventSchema = z.object({
  locale: z.string().min(2).max(8),
  id: z.string().uuid(),
});

export type CreateSpecialCalendarEventInput = z.infer<typeof createSpecialCalendarEventSchema>;
