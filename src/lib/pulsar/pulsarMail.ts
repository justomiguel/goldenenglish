import "server-only";

import { Resend } from "resend";
import { z } from "zod";
import { logServerException, logServerWarn, logSupabaseError } from "@/lib/logging/serverActionLog";
import { clipMailDetail, renderPulsarMailHtml, type PulsarMailDraft } from "@/lib/pulsar/pulsarMailMessage";
import { loadPulsarPlatformHostsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";
import { normalizeHost } from "@/lib/tenant/tenantRegistry";

export interface PulsarMailSettingsView {
  fromEmail: string;
  notifyEmail: string;
  hasApiKey: boolean;
  last: { ok: boolean; code: string; detail: string; at: string } | null;
}

export type PulsarMailResult =
  | { ok: true; code: "sent" }
  | { ok: false; errorCode: "resend_unconfigured" | "resend_rejected" | "resend_failed"; detail: string };

const saveSchema = z.object({
  fromEmail: z.string().trim().email().max(320),
  notifyEmail: z.string().trim().email().max(320),
  apiKey: z.string().trim().max(200).optional(),
});

export async function loadPulsarMailSettings(): Promise<PulsarMailSettingsView> {
  const empty = { fromEmail: "", notifyEmail: "", hasApiKey: false, last: null };
  if (!isPulsarSupabaseConfigured()) return empty;
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("resend_from_email, notify_email, resend_api_key, mail_last_ok, mail_last_code, mail_last_detail, mail_last_at")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return empty;
  return {
    fromEmail: String(data.resend_from_email ?? ""),
    notifyEmail: String(data.notify_email ?? ""),
    hasApiKey: Boolean(String(data.resend_api_key ?? "").trim()),
    last: data.mail_last_at
      ? {
          ok: Boolean(data.mail_last_ok),
          code: String(data.mail_last_code ?? ""),
          detail: String(data.mail_last_detail ?? ""),
          at: String(data.mail_last_at),
        }
      : null,
  };
}

export async function savePulsarMailSettings(input: {
  fromEmail: string;
  notifyEmail: string;
  apiKey?: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalid_input" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const patch: Record<string, string> = {
    resend_from_email: parsed.data.fromEmail,
    notify_email: parsed.data.notifyEmail,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.apiKey) patch.resend_api_key = parsed.data.apiKey;
  const { error } = await admin.from("platform_settings").update(patch).eq("id", "default");
  if (error) {
    logSupabaseError("savePulsarMailSettings", error, {});
    return { ok: false, errorCode: "db_write_failed" };
  }
  return { ok: true };
}

export async function loadPulsarOutboundMailAccount(): Promise<{ key: string; from: string } | null> {
  const creds = await resendCredentials();
  if (!creds) return null;
  return { key: creds.key, from: creds.from };
}

async function resendCredentials(): Promise<{ key: string; from: string; notify: string } | null> {
  if (!isPulsarSupabaseConfigured()) return null;
  const admin = createPulsarAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("resend_api_key, resend_from_email, notify_email")
    .eq("id", "default")
    .maybeSingle();
  const key =
    String(data?.resend_api_key ?? "").trim() ||
    process.env.PULSAR_RESEND_API_KEY?.trim() ||
    "";
  const from =
    String(data?.resend_from_email ?? "").trim() ||
    process.env.PULSAR_RESEND_FROM_EMAIL?.trim() ||
    "";
  const notify = String(data?.notify_email ?? "").trim();
  if (!key || !from) return null;
  return { key, from, notify };
}

async function pulsarMailOrigin(): Promise<string> {
  const hosts = await loadPulsarPlatformHostsForAdmin();
  const host = hosts
    .map((item) => normalizeHost(item))
    .find((item) => item.includes(".") && !item.includes("localhost"));
  if (host) return `https://${host}`;
  return getPublicSiteUrl()?.origin ?? "";
}

async function rememberMailResult(result: PulsarMailResult): Promise<void> {
  if (!isPulsarSupabaseConfigured()) return;
  const admin = createPulsarAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      mail_last_ok: result.ok,
      mail_last_code: result.ok ? result.code : result.errorCode,
      mail_last_detail: result.ok ? "" : clipMailDetail(result.detail),
      mail_last_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) logSupabaseError("rememberMailResult", error, {});
}

/** Sends Pulsar account mail and stores the last result. A missing key does not throw. */
export async function sendPulsarMail(messages: readonly PulsarMailDraft[]): Promise<PulsarMailResult> {
  const ready = messages.filter((message) => message.to.includes("@"));
  const finish = async (result: PulsarMailResult) => {
    await rememberMailResult(result);
    return result;
  };
  if (ready.length === 0) return finish({ ok: false, errorCode: "resend_unconfigured", detail: "" });
  try {
    const creds = await resendCredentials();
    if (!creds) {
      logServerWarn("sendPulsarMail:skipped", { reason: "resend_unconfigured", count: ready.length });
      return finish({ ok: false, errorCode: "resend_unconfigured", detail: "" });
    }
    const resend = new Resend(creds.key);
    const origin = await pulsarMailOrigin();
    for (const message of ready) {
      const html = renderPulsarMailHtml({
        bodyHtml: message.html,
        locale: message.locale,
        origin,
        brandName: message.brandName,
        contactEmail: creds.from,
      });
      const { error } = await resend.emails.send({
        from: creds.from,
        to: message.to,
        subject: message.subject,
        html,
      });
      if (error) {
        logServerWarn("sendPulsarMail:rejected", { reason: "resend_rejected" });
        return finish({ ok: false, errorCode: "resend_rejected", detail: clipMailDetail(error.message ?? "") });
      }
    }
    return finish({ ok: true, code: "sent" });
  } catch (err) {
    logServerException("sendPulsarMail", err);
    return finish({ ok: false, errorCode: "resend_failed", detail: "" });
  }
}
