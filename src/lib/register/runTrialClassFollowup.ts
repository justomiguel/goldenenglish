import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";
import { markTrialSeatAttendance } from "@/lib/register/markTrialSeatAttendance";
import { notifyTrialAdminAttendanceDue } from "@/lib/register/notifyTrialSeatMails";
import {
  isTrialSeatAdminReminderDue,
  nextInstituteDateIso,
} from "@/lib/register/trialSeatClassWindow";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

type BookedSeat = {
  id: string;
  scheduled_on: string;
  start_time: string;
  admin_reminder_sent_at: string | null;
  registration: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  section: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function runTrialClassFollowup(
  admin: SupabaseClient,
  now = new Date(),
): Promise<{ reminders: number; absents: number; released: number }> {
  const timeZone = getInstituteTimeZone();
  const todayIso = instituteCalendarDateIso(now, timeZone);
  const tomorrowIso = nextInstituteDateIso(now, timeZone);
  const dict = await getDictionary(defaultLocale);
  const locale = defaultLocale;

  let reminders = 0;
  let absents = 0;
  let released = 0;

  const { data: booked, error: bookedErr } = await admin
    .from("registration_trial_seats")
    .select(
      "id, scheduled_on, start_time, admin_reminder_sent_at, registration:registrations(first_name, last_name), section:academic_sections(name)",
    )
    .eq("status", "booked")
    .in("scheduled_on", [todayIso, tomorrowIso]);
  if (bookedErr) {
    logSupabaseClientError("runTrialClassFollowup:booked", bookedErr);
  } else {
    for (const raw of (booked ?? []) as BookedSeat[]) {
      try {
        if (
          !isTrialSeatAdminReminderDue({
            scheduledOn: String(raw.scheduled_on).slice(0, 10),
            startTime: String(raw.start_time),
            timeZone,
            now,
            reminderAlreadySent: Boolean(raw.admin_reminder_sent_at),
          })
        ) {
          continue;
        }
        const lead = one(raw.registration);
        await notifyTrialAdminAttendanceDue({
          locale,
          studentName: `${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`.trim() || "—",
          sectionName: one(raw.section)?.name?.trim() || "—",
          scheduleLabel: `${String(raw.scheduled_on).slice(0, 10)} ${String(raw.start_time).slice(0, 5)}`,
        });
        const { error } = await admin
          .from("registration_trial_seats")
          .update({ admin_reminder_sent_at: now.toISOString() })
          .eq("id", raw.id)
          .is("admin_reminder_sent_at", null);
        if (!error) reminders += 1;
      } catch (err) {
        logServerException("runTrialClassFollowup:reminder", err, { seatId: raw.id });
      }
    }
  }

  const { data: stale, error: staleErr } = await admin
    .from("registration_trial_seats")
    .select("id")
    .eq("status", "booked")
    .lt("scheduled_on", todayIso)
    .limit(200);
  if (staleErr) {
    logSupabaseClientError("runTrialClassFollowup:stale", staleErr);
  } else {
    for (const row of stale ?? []) {
      try {
        const marked = await markTrialSeatAttendance({
          admin,
          seatId: String(row.id),
          mark: "absent",
          markedBy: null,
          locale,
          dict,
          now,
        });
        if (marked.ok) absents += 1;
      } catch (err) {
        logServerException("runTrialClassFollowup:absent", err, { seatId: row.id });
      }
    }
  }

  const { data: expired, error: expErr } = await admin
    .from("registrations")
    .select("id")
    .not("trial_convert_expires_at", "is", null)
    .lt("trial_convert_expires_at", now.toISOString())
    .neq("status", "enrolled")
    .limit(200);
  if (expErr) {
    logSupabaseClientError("runTrialClassFollowup:expired", expErr);
  } else {
    const ids = (expired ?? []).map((r) => String(r.id)).filter(Boolean);
    if (ids.length) {
      const { data: releasedRows, error: relErr } = await admin
        .from("registration_trial_seats")
        .update({ status: "released" })
        .in("registration_id", ids)
        .eq("status", "attended")
        .select("id");
      if (relErr) {
        logSupabaseClientError("runTrialClassFollowup:release", relErr);
      } else {
        released = releasedRows?.length ?? 0;
      }
    }
  }

  return { reminders, absents, released };
}
