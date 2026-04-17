"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  createSpecialCalendarEventSchema,
  deleteSpecialCalendarEventSchema,
  updateSpecialCalendarEventSchema,
} from "@/lib/calendar/portalSpecialEventsParse";
import { inferSpecialEventIntervalCordoba } from "@/lib/calendar/inferSpecialEventIntervalCordoba";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const S = "portalSpecialCalendarEvents" as const;

function revalidateCalendarSurfaces(locale: string) {
  revalidatePath(`/${locale}/dashboard/admin/calendar`, "page");
  revalidatePath(`/${locale}/dashboard/admin/calendar/special`, "page");
  revalidatePath(`/${locale}/dashboard/student/calendar`, "page");
  revalidatePath(`/${locale}/dashboard/parent/calendar`, "page");
  revalidatePath(`/${locale}/dashboard/teacher/calendar`, "page");
}

export type SpecialEventActionCode = "PARSE" | "SAVE" | "AUTH";

function scopeColumnsFromParsed(d: {
  calendarScope: "global" | "cohort" | "section";
  cohortId: string | null | undefined;
  sectionId: string | null | undefined;
}) {
  if (d.calendarScope === "global") return { cohort_id: null as string | null, section_id: null as string | null };
  if (d.calendarScope === "cohort") return { cohort_id: d.cohortId ?? null, section_id: null as string | null };
  return { cohort_id: null as string | null, section_id: d.sectionId ?? null };
}

export async function createPortalSpecialCalendarEventAction(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; code: SpecialEventActionCode }> {
  const parsed = createSpecialCalendarEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const interval = inferSpecialEventIntervalCordoba({
    eventDate: parsed.data.eventDate,
    allDay: parsed.data.allDay,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
  });
  if (!interval) return { ok: false, code: "PARSE" };

  try {
    const { supabase, user } = await assertAdmin();
    const scopeCols = scopeColumnsFromParsed(parsed.data);
    const { data, error } = await supabase
      .from("portal_special_calendar_events")
      .insert({
        title: parsed.data.title,
        notes: parsed.data.notes,
        starts_at: interval.starts_at,
        ends_at: interval.ends_at,
        all_day: parsed.data.allDay,
        created_by: user.id,
        event_type: parsed.data.eventType,
        calendar_scope: parsed.data.calendarScope,
        cohort_id: scopeCols.cohort_id,
        section_id: scopeCols.section_id,
        meeting_url: parsed.data.meetingUrl,
      })
      .select("id")
      .maybeSingle();
    if (error || !data?.id) {
      if (error) logSupabaseClientError(`${S}:create`, error, {});
      return { ok: false, code: "SAVE" };
    }
    void recordSystemAudit({
      action: "portal_special_calendar_event_created",
      resourceType: "portal_special_calendar_event",
      resourceId: data.id as string,
      payload: {
        all_day: parsed.data.allDay,
        event_type: parsed.data.eventType,
        calendar_scope: parsed.data.calendarScope,
      },
    });
    revalidateCalendarSurfaces(parsed.data.locale);
    return { ok: true, id: data.id as string };
  } catch (e) {
    logServerActionException(`${S}:create`, e, {});
    return { ok: false, code: "SAVE" };
  }
}

export async function updatePortalSpecialCalendarEventAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; code: SpecialEventActionCode }> {
  const parsed = updateSpecialCalendarEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const interval = inferSpecialEventIntervalCordoba({
    eventDate: parsed.data.eventDate,
    allDay: parsed.data.allDay,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
  });
  if (!interval) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();
    const scopeCols = scopeColumnsFromParsed(parsed.data);
    const { error } = await supabase
      .from("portal_special_calendar_events")
      .update({
        title: parsed.data.title,
        notes: parsed.data.notes,
        starts_at: interval.starts_at,
        ends_at: interval.ends_at,
        all_day: parsed.data.allDay,
        event_type: parsed.data.eventType,
        calendar_scope: parsed.data.calendarScope,
        cohort_id: scopeCols.cohort_id,
        section_id: scopeCols.section_id,
        meeting_url: parsed.data.meetingUrl,
      })
      .eq("id", parsed.data.id);
    if (error) {
      logSupabaseClientError(`${S}:update`, error, { id: parsed.data.id });
      return { ok: false, code: "SAVE" };
    }
    void recordSystemAudit({
      action: "portal_special_calendar_event_updated",
      resourceType: "portal_special_calendar_event",
      resourceId: parsed.data.id,
      payload: {
        all_day: parsed.data.allDay,
        event_type: parsed.data.eventType,
        calendar_scope: parsed.data.calendarScope,
      },
    });
    revalidateCalendarSurfaces(parsed.data.locale);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/calendar/special/${parsed.data.id}`, "page");
    return { ok: true };
  } catch (e) {
    logServerActionException(`${S}:update`, e, { id: (input as { id?: string })?.id });
    return { ok: false, code: "SAVE" };
  }
}

export async function deletePortalSpecialCalendarEventAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; code: SpecialEventActionCode }> {
  const parsed = deleteSpecialCalendarEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("portal_special_calendar_events").delete().eq("id", parsed.data.id);
    if (error) {
      logSupabaseClientError(`${S}:delete`, error, { id: parsed.data.id });
      return { ok: false, code: "SAVE" };
    }
    void recordSystemAudit({
      action: "portal_special_calendar_event_deleted",
      resourceType: "portal_special_calendar_event",
      resourceId: parsed.data.id,
      payload: {},
    });
    revalidateCalendarSurfaces(parsed.data.locale);
    return { ok: true };
  } catch (e) {
    logServerActionException(`${S}:delete`, e, { id: (input as { id?: string })?.id });
    return { ok: false, code: "SAVE" };
  }
}
