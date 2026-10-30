"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { loadPulsarMailSettings, savePulsarMailSettings, sendPulsarMail } from "@/lib/pulsar/pulsarMail";
import { pulsarMailMessage } from "@/lib/pulsar/pulsarMailMessage";
import { mailOwnerDecision } from "@/lib/pulsar/pulsarOwnerMail";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const reviewSchema = z.object({
  locale: z.string().min(2).max(5),
  userId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function reviewPulsarOwnerAction(raw: {
  locale: string;
  userId: string;
  decision: "approved" | "rejected";
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const session = await getPulsarStaffSession();
  if (!session || session.mustChangePassword) return { ok: false, errorCode: "unauthorized" };
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success || !isPulsarSupabaseConfigured()) return { ok: false, errorCode: "invalid_input" };

  const admin = createPulsarAdminClient();
  const { data: owner, error: readErr } = await admin
    .from("platform_owners")
    .select("email, status")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();
  if (readErr || !owner) return { ok: false, errorCode: "not_found" };
  const { error } = await admin
    .from("platform_owners")
    .update({ status: parsed.data.decision })
    .eq("user_id", parsed.data.userId);
  if (error) {
    logSupabaseError("reviewPulsarOwnerAction", error, { userId: parsed.data.userId });
    return { ok: false, errorCode: "db_write_failed" };
  }
  await admin.from("platform_audit_log").insert({
    actor_user_id: session.userId,
    actor_email: session.email,
    action: parsed.data.decision === "approved" ? "owner.approve" : "owner.reject",
    tenant_slug: "platform",
    changed_fields: ["status"],
  });
  await mailOwnerDecision(String(owner.email), parsed.data.locale, parsed.data.decision);
  revalidatePath(`/${parsed.data.locale}/admin`);
  revalidatePath(`/${parsed.data.locale}/cuenta`);
  return { ok: true };
}

export async function savePulsarMailSettingsAction(raw: {
  locale: string;
  fromEmail: string;
  notifyEmail: string;
  apiKey: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const session = await getPulsarStaffSession();
  if (!session || session.mustChangePassword) return { ok: false, errorCode: "unauthorized" };
  const saved = await savePulsarMailSettings({
    fromEmail: raw.fromEmail,
    notifyEmail: raw.notifyEmail,
    apiKey: raw.apiKey,
  });
  if (!saved.ok) return saved;
  revalidatePath(`/${raw.locale}/admin`);
  return { ok: true };
}

export async function sendPulsarMailTestAction(raw: {
  locale: string;
}): Promise<{ ok: true; code: "sent" } | { ok: false; errorCode: string; detail: string }> {
  const session = await getPulsarStaffSession();
  if (!session || session.mustChangePassword) return { ok: false, errorCode: "unauthorized", detail: "" };
  const settings = await loadPulsarMailSettings();
  const locale: AppLocale = raw.locale === "en" || raw.locale === "pt" ? raw.locale : "es";
  const dict = await getDictionary(locale);
  const draft = pulsarMailMessage({
    to: settings.notifyEmail,
    subject: dict.pulsar.mail.testSubject,
    body: dict.pulsar.mail.testBody,
    vars: {},
    locale,
    brandName: dict.pulsar.meta.brandName,
  });
  if (!draft) return { ok: false, errorCode: "notify_missing", detail: "" };
  const sent = await sendPulsarMail([draft]);
  revalidatePath(`/${raw.locale}/admin`);
  if (!sent.ok) return sent;
  return { ok: true, code: "sent" };
}
