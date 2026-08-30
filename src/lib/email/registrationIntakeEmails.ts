import "server-only";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";
import {
  logServerException,
  logServerInfo,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchAuthEmailsForUserIds } from "@/lib/auth/batchAuthEmailsForUserIds";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import type { Locale } from "@/types/i18n";

export async function notifyRegistrationReceived(input: {
  locale: Locale;
  familyEmail: string | null;
  greetingName: string;
  studentName: string;
  sectionName: string;
  scheduleLabel: string;
  amountLabel: string;
  payUrl: string;
  payCta: string;
  noFeeNote: string;
  adminVars: Record<string, string>;
}): Promise<void> {
  const payBlock = buildRegistrationPayBlock({
    payUrl: input.payUrl,
    amountLabel: input.amountLabel,
    ctaLabel: input.payCta,
    noFeeNote: input.noFeeNote,
  });
  const familyVars = {
    greetingName: input.greetingName,
    studentName: input.studentName,
    sectionName: input.sectionName,
    scheduleLabel: input.scheduleLabel,
    amountLabel: input.amountLabel,
    payBlock,
  };
  if (input.familyEmail) {
    const sent = await sendBrandedEmail({
      to: input.familyEmail,
      templateKey: "registration.received",
      locale: input.locale,
      vars: familyVars,
    });
    if (!sent.ok) {
      logServerException("notifyRegistrationReceived:family", new Error(sent.error));
    }
  }
  await sendRegistrationAdminEmails({
    locale: input.locale,
    templateKey: "registration.admin_received",
    vars: input.adminVars,
  });
}

/**
 * Single family welcome after accept / matrícula capture.
 * Recipients follow the same minor→tutor / adult→student rule.
 * The admin-create welcome must not also fire on this path.
 */
export async function notifyRegistrationWelcome(input: {
  locale: string;
  isMinor: boolean;
  studentEmail: string | null;
  tutorEmail: string | null;
  greetingName: string;
  studentName: string;
  sectionName: string;
  scheduleLabel: string;
}): Promise<void> {
  const locale: Locale = input.locale === "en" || input.locale === "pt" ? input.locale : "es";
  const studentEmail = (input.studentEmail ?? "").trim().toLowerCase();
  const domain = getRegistrationMailTenantDomain();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain}`));
  const familyEmail = resolveRegistrationFamilyEmail({
    isMinor: input.isMinor,
    tutorEmail: input.tutorEmail,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
  if (!familyEmail || !isDeliverableAuthEmail(familyEmail)) return;

  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const inviteUrl = `${origin}/${locale}/login`;
  const sent = await sendBrandedEmail({
    to: familyEmail,
    templateKey: "registration.welcome",
    locale,
    vars: {
      greetingName: input.greetingName,
      studentName: input.studentName,
      sectionName: input.sectionName,
      scheduleLabel: input.scheduleLabel,
      amountLabel: "",
      payBlock: "",
      inviteUrl,
    },
  });
  if (!sent.ok) {
    logServerException("notifyRegistrationWelcome:send", new Error(sent.error));
  }
}

export async function sendRegistrationAdminEmails(input: {
  locale: Locale;
  templateKey:
    | "registration.admin_received"
    | "registration.admin_receipt_pending"
    | "registration.admin_enrolled"
    | "registration.admin_needs_section"
    | "registration.admin_trial_attendance_due"
    | "registration.admin_trial_enrolled";
  vars: Record<string, string>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(200);
    if (error) {
      logSupabaseClientError("sendRegistrationAdminEmails:list", error, {
        templateKey: input.templateKey,
        locale: input.locale,
      });
      return;
    }
    const adminIds = [...new Set((data ?? []).map((row) => String(row.id ?? "")))]
      .filter((id) => id && id !== PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
    const byId = await batchAuthEmailsForUserIds(adminIds);
    const emails = [...new Set(
      adminIds
        .map((id) => (byId.get(id) ?? "").trim().toLowerCase())
        .filter((email) => isDeliverableAuthEmail(email)),
    )];
    logServerInfo("sendRegistrationAdminEmails:list", {
      templateKey: input.templateKey,
      locale: input.locale,
      adminIds: adminIds.length,
      authEmails: byId.size,
      deliverable: emails.length,
    });
    if (emails.length === 0) {
      logServerWarn("sendRegistrationAdminEmails:list", {
        reason: "no_deliverable_admins",
        templateKey: input.templateKey,
        adminIds: adminIds.length,
        authEmails: byId.size,
      });
    }
    for (const to of emails) {
      const sent = await sendBrandedEmail({
        to,
        templateKey: input.templateKey,
        locale: input.locale,
        vars: input.vars,
      });
      if (!sent.ok) {
        logServerException("sendRegistrationAdminEmails:send", new Error(sent.error), {
          templateKey: input.templateKey,
        });
      }
    }
  } catch (err) {
    logServerException("sendRegistrationAdminEmails", err);
  }
}
