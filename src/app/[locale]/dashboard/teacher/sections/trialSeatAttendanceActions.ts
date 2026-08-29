"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { markTrialSeatAttendance } from "@/lib/register/markTrialSeatAttendance";
import { generateRegistrationPayToken } from "@/lib/register/generateRegistrationPayToken";
import { addCalendarMonthsUtc } from "@/lib/register/trialSeatClassWindow";
import { notifyTrialSeatInvite } from "@/lib/register/notifyTrialSeatMails";
import { familyEmailForTrialLead } from "@/lib/register/notifyTrialSeatMails";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { logServerException } from "@/lib/logging/serverActionLog";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import type { Locale } from "@/types/i18n";

const markSchema = z.object({
  locale: z.string().min(1),
  seatId: z.string().uuid(),
  mark: z.enum(["present", "absent"]),
  sectionId: z.string().uuid().optional(),
});

export type TrialSeatMarkActionState = { ok: true } | { ok: false; code: string };

async function actorCanMarkSeat(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  sectionId: string | undefined;
}): Promise<{ ok: true; markedBy: string } | { ok: false; code: "auth" | "forbidden" }> {
  const isAdmin = await resolveIsAdminSession(input.supabase, input.userId);
  if (isAdmin) return { ok: true, markedBy: input.userId };
  if (!input.sectionId) return { ok: false, code: "forbidden" };
  const staff = await userIsSectionTeacherOrAssistant(
    input.supabase,
    input.userId,
    input.sectionId,
  );
  if (!staff) return { ok: false, code: "forbidden" };
  return { ok: true, markedBy: input.userId };
}

function revalidateTrialSurfaces(locale: string, sectionId?: string) {
  revalidatePath(`/${locale}/dashboard/admin/registrations`);
  if (sectionId) {
    revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}/attendance`);
    revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}`);
    revalidatePath(`/${locale}/dashboard/assistant/sections/${sectionId}/attendance`);
    revalidatePath(`/${locale}/dashboard/admin/academic`);
  }
}

export async function markTrialSeatAttendanceAction(input: {
  locale: string;
  seatId: string;
  mark: "present" | "absent";
  sectionId?: string;
}): Promise<TrialSeatMarkActionState> {
  const parsed = markSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, code: "auth" };
    const access = await actorCanMarkSeat({
      supabase,
      userId: user.id,
      sectionId: parsed.data.sectionId,
    });
    if (!access.ok) return access;

    const admin = createAdminClient();
    if (parsed.data.sectionId) {
      const { data: seat } = await admin
        .from("registration_trial_seats")
        .select("section_id")
        .eq("id", parsed.data.seatId)
        .maybeSingle();
      if (!seat || String(seat.section_id) !== parsed.data.sectionId) {
        return { ok: false, code: "forbidden" };
      }
    }

    const dict = await getDictionary(parsed.data.locale);
    const result = await markTrialSeatAttendance({
      admin,
      seatId: parsed.data.seatId,
      mark: parsed.data.mark,
      markedBy: access.markedBy,
      locale: parsed.data.locale,
      dict,
    });
    if (result.ok) revalidateTrialSurfaces(parsed.data.locale, parsed.data.sectionId);
    return result;
  } catch (err) {
    logServerException("markTrialSeatAttendanceAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function resendTrialConvertInviteAction(input: {
  locale: string;
  registrationId: string;
}): Promise<TrialSeatMarkActionState> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const { data: lead, error } = await admin
      .from("registrations")
      .select(
        "id, first_name, last_name, email, tutor_name, tutor_email, birth_date, trial_convert_token, trial_convert_expires_at, status",
      )
      .eq("id", input.registrationId)
      .maybeSingle();
    if (error || !lead) return { ok: false, code: "not_found" };
    const token = lead.trial_convert_token ? String(lead.trial_convert_token) : "";
    const expires = lead.trial_convert_expires_at ? new Date(String(lead.trial_convert_expires_at)) : null;
    if (!token || !expires || expires.getTime() <= Date.now() || lead.status === "enrolled") {
      return { ok: false, code: "expired" };
    }
    const dict = await getDictionary(input.locale);
    const locale: Locale = input.locale === "en" || input.locale === "pt" ? input.locale : "es";
    const birth = lead.birth_date ? String(lead.birth_date).slice(0, 10) : "";
    const isMinor = birth
      ? fullYearsFromIsoDate(birth) < getLegalAgeMajorityFromSystem()
      : false;
    const studentName = `${lead.first_name} ${lead.last_name}`.trim();
    await notifyTrialSeatInvite({
      locale,
      dict,
      familyEmail: familyEmailForTrialLead({
        isMinor,
        studentEmail: lead.email as string | null,
        tutorEmail: lead.tutor_email as string | null,
      }),
      greetingName: (String(lead.tutor_name ?? lead.first_name)).trim() || studentName,
      studentName,
      sectionName: "—",
      scheduleLabel: "—",
      convertToken: token,
    });
    revalidateTrialSurfaces(input.locale);
    return { ok: true };
  } catch (err) {
    logServerException("resendTrialConvertInviteAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function remintTrialConvertTokenAction(input: {
  locale: string;
  registrationId: string;
}): Promise<TrialSeatMarkActionState> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const { data: lead, error } = await admin
      .from("registrations")
      .select("id, status, intent")
      .eq("id", input.registrationId)
      .maybeSingle();
    if (error || !lead || lead.intent !== "trial" || lead.status === "enrolled") {
      return { ok: false, code: "not_found" };
    }
    const token = generateRegistrationPayToken();
    const { error: upErr } = await admin
      .from("registrations")
      .update({
        trial_convert_token: token,
        trial_convert_expires_at: addCalendarMonthsUtc(new Date(), 3).toISOString(),
      })
      .eq("id", input.registrationId);
    if (upErr) return { ok: false, code: "save" };
    return resendTrialConvertInviteAction(input);
  } catch (err) {
    logServerException("remintTrialConvertTokenAction", err);
    return { ok: false, code: "auth" };
  }
}
