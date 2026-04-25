"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getBrandPublic } from "@/lib/brand/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { incrementRetentionContactCount } from "@/lib/academics/incrementRetentionContactCount";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { notifyRetentionOutreachInApp } from "@/lib/messaging/notifyRetentionOutreachInApp";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  logServerActionException,
  logServerActionInvariantViolation,
  logServerAuthzDenied,
} from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import type { SendRetentionContactEmailCode } from "@/types/retentionContactEmail";
import { resolveRetentionContactEmailRecipient } from "@/lib/academics/resolveRetentionContactEmailRecipient";

const uuid = z.string().uuid();

const schema = z.object({
  locale: z.enum(["en", "es"]),
  cohortId: uuid,
  studentId: uuid,
  enrollmentId: uuid,
  /** Tutor o el mismo `studentId` si el alumno no tiene tutores y gestiona su facturación. */
  mailUserId: uuid,
  isSelfContact: z.boolean(),
  studentLabel: z.string().trim().min(1).max(500),
  sectionName: z.string().trim().min(1).max(500),
  signals: z.string().trim().min(1).max(2000),
  guardianLabel: z.string().trim().max(500),
});

export type { SendRetentionContactEmailCode };

const S = "sendRetentionContactEmailAction" as const;

export async function sendRetentionContactEmailAction(input: unknown): Promise<
  | { ok: true }
  | {
      ok: false;
      code: SendRetentionContactEmailCode;
      /** Motivo de proveedor o mensaje no-PII para soporte (admin). */
      message?: string;
    }
> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    logServerActionInvariantViolation(S, "parse", { issueCount: parsed.error.issues.length });
    return { ok: false, code: "PARSE" };
  }

  const data = parsed.data;

  let userSupabase: SupabaseClient;
  let adminUserId: string;
  try {
    const a = await assertAdmin();
    userSupabase = a.supabase;
    adminUserId = a.user.id;
  } catch {
    logServerAuthzDenied(S, { enrollmentId: data.enrollmentId });
    return { ok: false, code: "FORBIDDEN" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    logServerActionException(S, e, { stage: "adminClient" });
    return { ok: false, code: "SEND" };
  }

  const resolved = await resolveRetentionContactEmailRecipient(admin, {
    cohortId: data.cohortId,
    studentId: data.studentId,
    enrollmentId: data.enrollmentId,
    mailUserId: data.mailUserId,
    isSelfContact: data.isSelfContact,
  });
  if (!resolved.ok) {
    return { ok: false, code: resolved.code };
  }
  const { to } = resolved;

  const brand = getBrandPublic();
  const dict = await getDictionary(data.locale);
  const intro = dict.dashboard.adminRetention.emailIntro;

  const send = await sendBrandedEmail({
    to,
    templateKey: "academics.retention_contact",
    locale: data.locale as Locale,
    vars: {
      brandName: brand.name,
      intro,
      guardianLabel: data.guardianLabel.length > 0 ? data.guardianLabel : "—",
      studentLabel: data.studentLabel,
      sectionName: data.sectionName,
      signals: data.signals,
    },
  });

  if (!send.ok) {
    logServerActionInvariantViolation(S, "branded_email_rejected", {
      error: send.error,
      templateKey: "academics.retention_contact",
      enrollmentId: data.enrollmentId,
    });
    return {
      ok: false,
      code: send.error === "unknown_template_key" ? "SEND" : "EMAIL_FAILED",
      message: send.error,
    };
  }

  const incEmail = await incrementRetentionContactCount(userSupabase, data.enrollmentId, "email");
  if (!incEmail.ok) {
    logServerActionInvariantViolation(S, "increment_email_count_failed", {
      enrollmentId: data.enrollmentId,
      message: incEmail.message,
    });
  }

  const { data: adminProf } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", adminUserId)
    .maybeSingle();
  const ap = adminProf as { first_name?: string | null; last_name?: string | null } | null;
  const adminDisplayName =
    ap && `${ap.first_name ?? ""} ${ap.last_name ?? ""}`.trim().length > 0
      ? `${ap.first_name ?? ""} ${ap.last_name ?? ""}`.trim()
      : "Admin";

  try {
    await notifyRetentionOutreachInApp({
      supabase: userSupabase,
      adminUserId,
      adminDisplayName,
      recipientUserId: data.mailUserId,
      studentLabel: data.studentLabel,
      sectionName: data.sectionName,
      locale: data.locale,
      channel: "email",
      emailProvider: getEmailProvider(),
    });
  } catch (e) {
    logServerActionException(S, e, { stage: "notifyRetentionInApp" });
  }

  await recordSystemAudit({
    action: "retention_contact_email_sent",
    resourceType: "section_enrollment",
    resourceId: data.enrollmentId,
    payload: {
      cohort_id: data.cohortId,
      student_id: data.studentId,
      mail_user_id: data.mailUserId,
      is_self: data.isSelfContact,
      template_key: "academics.retention_contact",
    },
  });

  revalidatePath(`/${data.locale}/dashboard/admin/academic/${data.cohortId}`, "page");

  return { ok: true };
}
