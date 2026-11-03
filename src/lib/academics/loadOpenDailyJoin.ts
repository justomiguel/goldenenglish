import { parseDeliveryMode } from "@/lib/academics/sectionDeliveryMode";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  resolveOpenDailyJoin,
  type OpenDailyJoinCandidate,
  type OpenDailyJoinOffer,
} from "@/lib/academics/resolveOpenDailyJoin";
import { loadSectionDailyTenantFlags } from "@/lib/academics/sectionDailyTenant";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";

const JOIN_SCOPE = "sectionDaily.joinHref";
const FALLBACK_TZ = "America/Argentina/Cordoba";

type RoomRow = { section_id: string; day_of_week: number; start_time: string };

async function loadInstituteTimeZone(): Promise<string> {
  const effective = await loadEffectiveProperties();
  return getProperty(effective.properties, "analytics.timezone", FALLBACK_TZ).trim() || FALLBACK_TZ;
}

async function loadRoomsBySection(sectionIds: string[]): Promise<Map<string, { dayOfWeek: number; startTime: string }[]>> {
  const rooms = new Map<string, { dayOfWeek: number; startTime: string }[]>();
  if (sectionIds.length === 0) return rooms;
  try {
    const admin = await createAdminClient();
    const roomsRes = await admin
      .from("section_daily_rooms")
      .select("section_id, day_of_week, start_time")
      .in("section_id", sectionIds);
    if (roomsRes.error) {
      logSupabaseClientError(JOIN_SCOPE, roomsRes.error, { reason: "rooms" });
      return rooms;
    }
    for (const row of (roomsRes.data ?? []) as RoomRow[]) {
      const list = rooms.get(row.section_id) ?? [];
      list.push({ dayOfWeek: row.day_of_week, startTime: row.start_time });
      rooms.set(row.section_id, list);
    }
  } catch (error) {
    logServerActionException(JOIN_SCOPE, error, { reason: "rooms" });
  }
  return rooms;
}

async function joinContext() {
  const [flags, timeZone] = await Promise.all([loadSectionDailyTenantFlags(), loadInstituteTimeZone()]);
  return { ...flags, timeZone, now: new Date() };
}

export async function loadStudentOpenDailyJoin(input: {
  locale: string;
  studentId: string;
}): Promise<OpenDailyJoinOffer | null> {
  const supabase = await createClient();
  const enrollments = await supabase
    .from("section_enrollments")
    .select("section_id, status")
    .eq("student_id", input.studentId)
    .eq("status", "active");
  if (enrollments.error) {
    logSupabaseClientError(JOIN_SCOPE, enrollments.error, { reason: "enrollments" });
    return null;
  }
  const sectionIds = [...new Set((enrollments.data ?? []).map((row) => row.section_id as string))];
  if (sectionIds.length === 0) return null;

  const [sectionsRes, rooms, ctx] = await Promise.all([
    supabase
      .from("academic_sections")
      .select("id, name, delivery_mode, schedule_slots, academic_cohorts(name)")
      .in("id", sectionIds),
    loadRoomsBySection(sectionIds),
    joinContext(),
  ]);
  if (sectionsRes.error) {
    logSupabaseClientError(JOIN_SCOPE, sectionsRes.error, { reason: "sections" });
    return null;
  }

  const candidates: OpenDailyJoinCandidate[] = (sectionsRes.data ?? []).map((row) => {
    const cohort = row.academic_cohorts as { name: string } | { name: string }[] | null;
    const cohortName = Array.isArray(cohort) ? (cohort[0]?.name ?? "") : (cohort?.name ?? "");
    const sectionName = row.name as string;
    return {
      sectionId: row.id as string,
      label: cohortName ? `${cohortName} — ${sectionName}` : sectionName,
      teacher: "",
      mode: parseDeliveryMode(row.delivery_mode),
      slots: parseSectionScheduleSlots(row.schedule_slots),
      rooms: rooms.get(row.id as string) ?? [],
    };
  });

  return resolveOpenDailyJoin({
    now: ctx.now,
    timeZone: ctx.timeZone,
    plan: ctx.commercialPlan,
    credentialsReady: ctx.dailyCredentialsReady,
    role: "student",
    locale: input.locale,
    persona: "student",
    candidates,
  });
}

export async function loadTeacherOpenDailyJoin(input: {
  locale: string;
  sectionId: string;
  userId: string;
}): Promise<OpenDailyJoinOffer | null> {
  const supabase = await createClient();
  const sectionRes = await supabase
    .from("academic_sections")
    .select("id, name, teacher_id, delivery_mode, schedule_slots, academic_cohorts(name)")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (sectionRes.error) {
    logSupabaseClientError(JOIN_SCOPE, sectionRes.error, { reason: "section" });
    return null;
  }
  const section = sectionRes.data;
  if (!section) return null;

  const role = section.teacher_id === input.userId ? "teacher" : "assistant";
  if (role !== "teacher") return null;

  const [rooms, ctx] = await Promise.all([loadRoomsBySection([input.sectionId]), joinContext()]);
  const cohort = section.academic_cohorts as { name: string } | { name: string }[] | null;
  const cohortName = Array.isArray(cohort) ? (cohort[0]?.name ?? "") : (cohort?.name ?? "");
  const sectionName = section.name as string;

  return resolveOpenDailyJoin({
    now: ctx.now,
    timeZone: ctx.timeZone,
    plan: ctx.commercialPlan,
    credentialsReady: ctx.dailyCredentialsReady,
    role,
    locale: input.locale,
    persona: "teacher",
    candidates: [
      {
        sectionId: input.sectionId,
        label: cohortName ? `${cohortName} — ${sectionName}` : sectionName,
        teacher: "",
        mode: parseDeliveryMode(section.delivery_mode),
        slots: parseSectionScheduleSlots(section.schedule_slots),
        rooms: rooms.get(input.sectionId) ?? [],
      },
    ],
  });
}
