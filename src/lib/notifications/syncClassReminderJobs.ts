import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parseClassReminderSiteSettings } from "@/lib/notifications/parseClassReminderSiteSettings";
import {
  buildClassReminderJobUpsertRows,
  type SyncReminderEnrollmentRow,
} from "@/lib/notifications/buildClassReminderJobUpsertRows";
import { chunkIds } from "@/lib/notifications/chunkIds";

const SETTING_KEYS = [
  "class_reminders_enabled",
  "class_reminder_prep_offset_minutes",
  "class_reminder_urgent_offset_minutes",
  "class_reminder_institute_tz",
  "class_reminder_whatsapp_quiet",
] as const;

const ENROLLMENT_PAGE = 350;
const IN_CHUNK = 120;

export async function syncClassReminderJobs(admin: SupabaseClient): Promise<{ upserted: number }> {
  const { data: settingRows, error: sErr } = await admin
    .from("site_settings")
    .select("key, value")
    .in("key", [...SETTING_KEYS]);
  if (sErr) {
    logSupabaseClientError("syncClassReminderJobs:site_settings", sErr);
    return { upserted: 0 };
  }
  const settings = parseClassReminderSiteSettings((settingRows ?? []) as Record<string, unknown>[]);
  if (!settings.remindersEnabled) {
    return { upserted: 0 };
  }

  const { data: enrRows, error: eErr } = await admin
    .from("section_enrollments")
    .select("id, student_id, section_id")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(ENROLLMENT_PAGE);
  if (eErr || !enrRows?.length) {
    if (eErr) logSupabaseClientError("syncClassReminderJobs:enrollments", eErr);
    return { upserted: 0 };
  }

  const sectionIds = [...new Set(enrRows.map((r) => (r as { section_id: string }).section_id))];
  const studentIds = [...new Set(enrRows.map((r) => (r as { student_id: string }).student_id))];

  type SectionRow = {
    id: string;
    name: string;
    cohort_id: string;
    teacher_id: string;
    starts_on: string;
    ends_on: string;
    schedule_slots: unknown;
    room_label: string | null;
  };
  const sectionsById = new Map<string, SectionRow>();
  for (const batch of chunkIds(sectionIds, IN_CHUNK)) {
    const { data: secs, error: secErr } = await admin
      .from("academic_sections")
      .select("id, name, cohort_id, teacher_id, starts_on, ends_on, schedule_slots, room_label, archived_at")
      .in("id", batch)
      .is("archived_at", null);
    if (secErr) {
      logSupabaseClientError("syncClassReminderJobs:sections", secErr);
      return { upserted: 0 };
    }
    for (const s of secs ?? []) {
      sectionsById.set((s as SectionRow).id, s as SectionRow);
    }
  }

  const cohortIds = [...new Set([...sectionsById.values()].map((s) => s.cohort_id))];
  const cohortNameById = new Map<string, string>();
  for (const batch of chunkIds(cohortIds, IN_CHUNK)) {
    const { data: cohorts, error: cErr } = await admin
      .from("academic_cohorts")
      .select("id, name, archived_at")
      .in("id", batch)
      .is("archived_at", null);
    if (cErr) {
      logSupabaseClientError("syncClassReminderJobs:cohorts", cErr);
      return { upserted: 0 };
    }
    for (const c of cohorts ?? []) {
      cohortNameById.set((c as { id: string }).id, String((c as { name: string }).name));
    }
  }

  const minorByStudent = new Map<string, boolean>();
  const tutorOrderByStudent = new Map<string, string[]>();
  for (const batch of chunkIds(studentIds, IN_CHUNK)) {
    const { data: profs, error: pErr } = await admin.from("profiles").select("id, is_minor").in("id", batch);
    if (pErr) {
      logSupabaseClientError("syncClassReminderJobs:profiles", pErr);
      return { upserted: 0 };
    }
    for (const p of profs ?? []) {
      minorByStudent.set((p as { id: string }).id, Boolean((p as { is_minor?: boolean }).is_minor));
    }
    const { data: links, error: tErr } = await admin
      .from("tutor_student_rel")
      .select("student_id, tutor_id, created_at")
      .in("student_id", batch)
      .order("created_at", { ascending: true });
    if (tErr) {
      logSupabaseClientError("syncClassReminderJobs:tutor_student_rel", tErr);
      return { upserted: 0 };
    }
    for (const row of links ?? []) {
      const sid = (row as { student_id: string }).student_id;
      const tid = (row as { tutor_id: string }).tutor_id;
      const arr = tutorOrderByStudent.get(sid) ?? [];
      arr.push(tid);
      tutorOrderByStudent.set(sid, arr);
    }
  }

  const nowMs = Date.now();
  const allRows: ReturnType<typeof buildClassReminderJobUpsertRows> = [];
  for (const e of enrRows) {
    const en = e as { id: string; student_id: string; section_id: string };
    const sec = sectionsById.get(en.section_id);
    if (!sec) continue;
    const cohortName = cohortNameById.get(sec.cohort_id);
    if (!cohortName) continue;
    const syncRow: SyncReminderEnrollmentRow = {
      enrollmentId: en.id,
      sectionId: sec.id,
      studentId: en.student_id,
      isMinor: minorByStudent.get(en.student_id) ?? false,
      cohortName,
      sectionName: sec.name,
      cohortId: sec.cohort_id,
      teacherId: sec.teacher_id,
      startsOn: sec.starts_on,
      endsOn: sec.ends_on,
      scheduleSlots: sec.schedule_slots,
      roomLabel: sec.room_label,
      tutorIdsOrdered: tutorOrderByStudent.get(en.student_id) ?? [],
    };
    allRows.push(...buildClassReminderJobUpsertRows(syncRow, settings, nowMs));
  }

  let upserted = 0;
  const chunkSize = 40;
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize);
    const { error: uErr } = await admin.from("class_reminder_jobs").upsert(chunk as never, {
      onConflict: "idempotency_key",
    });
    if (uErr) {
      logSupabaseClientError("syncClassReminderJobs:upsert", uErr, { chunkStart: i });
      continue;
    }
    upserted += chunk.length;
  }
  return { upserted };
}
