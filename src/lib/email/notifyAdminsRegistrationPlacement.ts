import "server-only";

import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { escapeEventEmailHtml } from "@/lib/events/eventEmailCopy";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/types/i18n";

export type PlacementMailKind = "needs_section" | "section_full";

function mailLocale(raw: string | null | undefined): Locale {
  return raw === "en" || raw === "pt" ? raw : "es";
}

function moneyLabel(snapshot: unknown, locale: Locale): string {
  const row = (snapshot ?? {}) as { total?: unknown; currency?: unknown };
  const amount = Number(row.total ?? 0);
  const currency = String(row.currency ?? "").trim().toUpperCase();
  if (!(amount > 0) || !/^[A-Z]{3}$/.test(currency)) return "—";
  try {
    return formatMoneyLabel(amount, currency, locale);
  } catch (err) {
    logServerException("notifyAdminsRegistrationPlacement:amount", err);
    return "—";
  }
}

async function registrationsUrl(locale: Locale): Promise<string> {
  try {
    const origin = (await getRequestPublicSiteUrl())?.origin;
    if (!origin) return "";
    return `${origin}/${locale}/dashboard/admin/registrations`;
  } catch (err) {
    logServerException("notifyAdminsRegistrationPlacement:url", err);
    return "";
  }
}

export async function notifyAdminsRegistrationPlacement(input: {
  admin: SupabaseClient;
  locale: string | null;
  registrationId: string;
  kind: PlacementMailKind;
}): Promise<void> {
  try {
    const locale = mailLocale(input.locale);
    const { data, error } = await input.admin
      .from("registrations")
      .select(
        "first_name, last_name, dni, birth_date, tutor_name, preferred_section_id, fee_snapshot",
      )
      .eq("id", input.registrationId)
      .maybeSingle();
    if (error || !data) {
      if (error) {
        logSupabaseClientError("notifyAdminsRegistrationPlacement:lead", error, {
          registrationId: input.registrationId,
        });
      }
      return;
    }
    const row = data as {
      first_name: string | null;
      last_name: string | null;
      dni: string | null;
      birth_date: string | null;
      tutor_name: string | null;
      preferred_section_id: string | null;
      fee_snapshot: unknown;
    };
    let sectionName = "—";
    if (row.preferred_section_id) {
      const section = await input.admin
        .from("academic_sections")
        .select("name")
        .eq("id", row.preferred_section_id)
        .maybeSingle();
      const name = (section.data as { name?: string } | null)?.name?.trim();
      if (name) sectionName = name;
    }
    const studentName = formatProfileNameSurnameFirst(row.first_name, row.last_name) || "—";
    const tutor = row.tutor_name?.trim() ?? "";
    await sendRegistrationAdminEmails({
      locale,
      templateKey:
        input.kind === "section_full"
          ? "registration.admin_section_full"
          : "registration.admin_needs_section",
      vars: {
        studentName: escapeEventEmailHtml(studentName),
        studentDni: escapeEventEmailHtml(row.dni?.trim() || "—"),
        studentBirth: escapeEventEmailHtml(row.birth_date?.slice(0, 10) || "—"),
        tutorBlock: tutor
          ? `<p style="margin:0 0 8px;">Tutor: ${escapeEventEmailHtml(tutor)}</p>`
          : "",
        sectionName: escapeEventEmailHtml(sectionName),
        scheduleLabel: escapeEventEmailHtml(sectionName),
        amountLabel: moneyLabel(row.fee_snapshot, locale),
        feeModeLabel: "—",
        sourceLabel: "pago",
        existingStudentLabel: "—",
        adminUrl: await registrationsUrl(locale),
      },
    });
  } catch (err) {
    logServerException("notifyAdminsRegistrationPlacement", err, {
      registrationId: input.registrationId,
      kind: input.kind,
    });
  }
}
