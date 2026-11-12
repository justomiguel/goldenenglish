"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getBrandForRequest } from "@/lib/brand/server";
import { sendWrappedHtmlEmail } from "@/lib/email/templates/sendWrappedHtmlEmail";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/types/i18n";

const idZ = z.string().uuid();

function asLocale(locale: string): Locale {
  if (locale === "en" || locale === "pt") return locale;
  return "es";
}

export async function sendRegistrationContactEmailAction(input: {
  locale: string;
  registrationId: string;
  bodyHtml: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("sendRegistrationContactEmail");
    return { ok: false, code: "forbidden" };
  }

  const parsed = idZ.safeParse(input.registrationId);
  if (!parsed.success) return { ok: false, code: "not_found" };

  const safeHtml = sanitizeMessageHtml(input.bodyHtml ?? "");
  if (stripHtmlToText(safeHtml).length === 0) return { ok: false, code: "empty_message" };

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("registrations")
    .select("id,email,tutor_email")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("sendRegistrationContactEmail:select", error, {
      registrationId: parsed.data,
    });
    return { ok: false, code: "not_found" };
  }
  if (!data) return { ok: false, code: "not_found" };

  const row = data as { tutor_email?: string | null; email?: string | null };
  const to = String(row.tutor_email || row.email || "").trim();
  if (!to) return { ok: false, code: "missing_registration_email" };

  const dict = await getDictionary(input.locale);
  const brand = await getBrandForRequest();
  const subject = dict.admin.registrations.funnel.contactMailSubject.replaceAll(
    "{{brand}}",
    brand.name,
  );
  const sent = await sendWrappedHtmlEmail({
    to,
    subject,
    bodyHtml: safeHtml,
    locale: asLocale(input.locale),
  });
  if (!sent.ok) {
    await logServerException("sendRegistrationContactEmail", new Error(sent.error ?? "email_failed"), {
      registrationId: parsed.data,
      code: "registration_contact_email_failed",
    });
    return { ok: false, code: "registration_contact_email_failed" };
  }
  return { ok: true };
}
