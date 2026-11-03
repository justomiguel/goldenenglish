import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { createFetchDailyRoomClient } from "@/lib/academics/dailyRoomClient";
import {
  issueSectionDailyToken,
  type IssueSectionDailyTokenResult,
} from "@/lib/academics/issueSectionDailyToken";
import { parseDeliveryMode } from "@/lib/academics/sectionDeliveryMode";
import { tenantDailyCredentials } from "@/lib/academics/sectionDailyTenant";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import {
  logServerActionException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { parseCommercialPlan } from "@/lib/pulsar/commercialPlan";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";

const JOIN_SCOPE = "sectionDaily.join";
const FALLBACK_TZ = "America/Argentina/Cordoba";

export type JoinSectionDailyClassInput = {
  sectionId: string;
  requested: { dayOfWeek: number; startTime: string } | null;
};

export type JoinSectionDailyClassResult = IssueSectionDailyTokenResult;

type SectionRow = {
  teacher_id: string;
  delivery_mode: unknown;
  schedule_slots: unknown;
};

type RoomRow = {
  day_of_week: number;
  start_time: string;
  daily_room_name: string;
  daily_room_url: string;
};

async function resolveJoinRole(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  sectionId: string;
  teacherId: string;
}): Promise<"teacher" | "student" | "assistant" | "other"> {
  if (input.userId === input.teacherId) return "teacher";

  const enrollment = await input.supabase
    .from("section_enrollments")
    .select("id")
    .eq("section_id", input.sectionId)
    .eq("student_id", input.userId)
    .eq("status", "active")
    .maybeSingle();
  if (enrollment.error) {
    logSupabaseClientError(JOIN_SCOPE, enrollment.error, { sectionId: input.sectionId });
  }
  if (enrollment.data) return "student";

  if (await userIsSectionTeacherOrAssistant(input.supabase, input.userId, input.sectionId)) {
    return "assistant";
  }
  return "other";
}

async function loadRoomRows(sectionId: string): Promise<RoomRow[]> {
  try {
    const admin = await createAdminClient();
    const roomsRes = await admin
      .from("section_daily_rooms")
      .select("day_of_week, start_time, daily_room_name, daily_room_url")
      .eq("section_id", sectionId);
    if (roomsRes.error) {
      logSupabaseClientError(JOIN_SCOPE, roomsRes.error, { sectionId });
      return [];
    }
    return (roomsRes.data ?? []) as RoomRow[];
  } catch (error) {
    logServerActionException(JOIN_SCOPE, error, { sectionId });
    return [];
  }
}

export async function joinSectionDailyClass(
  input: JoinSectionDailyClassInput,
): Promise<JoinSectionDailyClassResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logServerWarn(JOIN_SCOPE, { code: "person", reason: "no_session" });
    return { ok: false, code: "person" };
  }

  const sectionRes = await supabase
    .from("academic_sections")
    .select("teacher_id, delivery_mode, schedule_slots")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (sectionRes.error) {
    logSupabaseClientError(JOIN_SCOPE, sectionRes.error, { sectionId: input.sectionId });
    return { ok: false, code: "person" };
  }
  const section = sectionRes.data as SectionRow | null;
  if (!section) {
    logServerWarn(JOIN_SCOPE, { code: "person", reason: "section_missing", sectionId: input.sectionId });
    return { ok: false, code: "person" };
  }

  const [role, tenant, effective, profileRes, roomRows] = await Promise.all([
    resolveJoinRole({
      supabase,
      userId: user.id,
      sectionId: input.sectionId,
      teacherId: section.teacher_id,
    }),
    resolveRequestTenant(),
    loadEffectiveProperties(),
    supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle(),
    loadRoomRows(input.sectionId),
  ]);

  if (profileRes.error) {
    logSupabaseClientError(JOIN_SCOPE, profileRes.error, { sectionId: input.sectionId });
  }
  const profile = profileRes.data as { first_name?: string | null; last_name?: string | null } | null;

  const timeZone =
    getProperty(effective.properties, "analytics.timezone", FALLBACK_TZ).trim() || FALLBACK_TZ;
  const result = await issueSectionDailyToken({
    now: new Date(),
    timeZone,
    plan: parseCommercialPlan(tenant?.commercialPlan),
    mode: parseDeliveryMode(section.delivery_mode),
    credentials: tenantDailyCredentials(tenant),
    slots: parseSectionScheduleSlots(section.schedule_slots),
    rooms: roomRows.map((row) => ({
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      dailyRoomName: row.daily_room_name,
      dailyRoomUrl: row.daily_room_url,
    })),
    role,
    userName: formatProfileNameSurnameFirst(profile?.first_name, profile?.last_name),
    requested: input.requested,
    client: createFetchDailyRoomClient(fetch),
  });

  if (!result.ok) {
    logServerWarn(JOIN_SCOPE, { code: result.code, sectionId: input.sectionId });
    return result;
  }

  await recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.sectionDailyClass,
    metadata: {
      sectionId: input.sectionId,
      dayOfWeek: result.dayOfWeek,
      startTime: result.startTime,
    },
  });
  return result;
}
