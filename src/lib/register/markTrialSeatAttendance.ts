import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary, Locale } from "@/types/i18n";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { generateRegistrationPayToken } from "@/lib/register/generateRegistrationPayToken";
import { planTrialSeatMark, type TrialSeatStatus } from "@/lib/register/planTrialSeatMark";
import { addCalendarMonthsUtc } from "@/lib/register/trialSeatClassWindow";
import {
  familyEmailForTrialLead,
  notifyTrialSeatInvite,
  notifyTrialSeatMissed,
} from "@/lib/register/notifyTrialSeatMails";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

type LeadEmbed = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  tutor_name: string | null;
  tutor_email: string | null;
  birth_date: string | null;
  trial_convert_token: string | null;
  trial_reschedule_token: string | null;
  status: string;
};

type SeatEmbed = {
  id: string;
  status: string;
  scheduled_on: string;
  start_time: string;
  end_time: string;
  section_id: string;
  missed_mail_sent_at: string | null;
  registration: LeadEmbed | LeadEmbed[] | null;
  section: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asStatus(raw: string): TrialSeatStatus | null {
  if (raw === "booked" || raw === "attended" || raw === "absent" || raw === "released") {
    return raw;
  }
  return null;
}

function scheduleLabel(seat: { scheduled_on: string; start_time: string; end_time: string }): string {
  const start = String(seat.start_time).slice(0, 5);
  const end = String(seat.end_time).slice(0, 5);
  return `${seat.scheduled_on} ${start}–${end}`;
}

export async function markTrialSeatAttendance(input: {
  admin: SupabaseClient;
  seatId: string;
  mark: "present" | "absent";
  markedBy: string | null;
  locale: string;
  dict: Dictionary;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; code: "not_found" | "invalid" | "noop" | "save" }> {
  const now = input.now ?? new Date();
  const { data, error } = await input.admin
    .from("registration_trial_seats")
    .select(
      "id, status, scheduled_on, start_time, end_time, section_id, missed_mail_sent_at, registration:registrations(id, first_name, last_name, email, tutor_name, tutor_email, birth_date, trial_convert_token, trial_reschedule_token, status), section:academic_sections(name)",
    )
    .eq("id", input.seatId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("markTrialSeatAttendance:select", error, { seatId: input.seatId });
    return { ok: false, code: "save" };
  }
  const seat = data as SeatEmbed | null;
  const lead = one(seat?.registration);
  if (!seat || !lead) return { ok: false, code: "not_found" };
  const status = asStatus(String(seat.status));
  if (!status) return { ok: false, code: "invalid" };

  const plan = planTrialSeatMark({
    status,
    mark: input.mark,
    hasConvertToken: Boolean(lead.trial_convert_token),
    hasRescheduleToken: Boolean(lead.trial_reschedule_token),
    missedMailSent: Boolean(seat.missed_mail_sent_at),
  });
  if (!plan.ok) return { ok: false, code: plan.code };

  const convertToken = plan.mintConvertToken
    ? generateRegistrationPayToken()
    : (lead.trial_convert_token ?? "");
  const rescheduleToken = plan.mintRescheduleToken
    ? generateRegistrationPayToken()
    : (lead.trial_reschedule_token ?? "");

  const seatPatch: Record<string, unknown> = {
    status: plan.nextStatus,
    marked_at: now.toISOString(),
    marked_by: input.markedBy,
  };
  if (plan.sendMissed) seatPatch.missed_mail_sent_at = now.toISOString();

  const { error: seatErr } = await input.admin
    .from("registration_trial_seats")
    .update(seatPatch)
    .eq("id", input.seatId);
  if (seatErr) {
    logSupabaseClientError("markTrialSeatAttendance:seat", seatErr, { seatId: input.seatId });
    return { ok: false, code: "save" };
  }

  const leadPatch: Record<string, unknown> = {};
  if (plan.mintConvertToken) {
    leadPatch.trial_convert_token = convertToken;
    leadPatch.trial_convert_expires_at = addCalendarMonthsUtc(now, 3).toISOString();
  }
  if (plan.mintRescheduleToken) leadPatch.trial_reschedule_token = rescheduleToken;
  if (plan.sendInvite) leadPatch.trial_invite_sent_at = now.toISOString();
  if (Object.keys(leadPatch).length) {
    const { error: leadErr } = await input.admin
      .from("registrations")
      .update(leadPatch)
      .eq("id", lead.id);
    if (leadErr) {
      logSupabaseClientError("markTrialSeatAttendance:lead", leadErr, { leadId: lead.id });
    }
  }

  const locale: Locale = input.locale === "en" || input.locale === "pt" ? input.locale : "es";
  const birth = lead.birth_date ? String(lead.birth_date).slice(0, 10) : "";
  const isMinor = birth ? fullYearsFromIsoDate(birth, now) < getLegalAgeMajorityFromSystem() : false;
  const studentName = `${lead.first_name} ${lead.last_name}`.trim();
  const greetingName = (lead.tutor_name ?? lead.first_name).trim() || studentName;
  const sectionName = one(seat.section)?.name?.trim() || "—";
  const sched = scheduleLabel(seat);
  const familyEmail = familyEmailForTrialLead({
    isMinor,
    studentEmail: lead.email,
    tutorEmail: lead.tutor_email,
  });
  if (plan.sendInvite && convertToken) {
    await notifyTrialSeatInvite({
      locale,
      dict: input.dict,
      familyEmail,
      greetingName,
      studentName,
      sectionName,
      scheduleLabel: sched,
      convertToken,
    });
  }
  if (plan.sendMissed && rescheduleToken) {
    await notifyTrialSeatMissed({
      locale,
      dict: input.dict,
      familyEmail,
      greetingName,
      studentName,
      sectionName,
      scheduleLabel: sched,
      rescheduleToken,
    });
  }
  return { ok: true };
}
