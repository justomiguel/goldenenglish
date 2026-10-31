import { Resend } from "resend";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { preferTenantValue } from "@/lib/tenant/preferTenantValue";
import { chooseInstituteMailAccount } from "@/lib/pulsar/instituteMailAccount";
import { loadPulsarOutboundMailAccount } from "@/lib/pulsar/pulsarMail";
import { releasePulsarMailSend, reservePulsarMailSend } from "@/lib/pulsar/tenantPulsarMailQuota";
import { isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/emailProvider";

export async function resolveResendFromAddress(): Promise<string> {
  const tenant = await resolveRequestTenant();
  const from = preferTenantValue(tenant?.resendFromEmail, process.env.RESEND_FROM_EMAIL);
  if (from) return from;
  throw new Error("RESEND_FROM_EMAIL is required for outbound mail");
}

export async function resolveResendApiKey(): Promise<string | null> {
  const tenant = await resolveRequestTenant();
  const key = preferTenantValue(tenant?.resendApiKey, process.env.RESEND_API_KEY);
  return key || null;
}

async function deliverWithKey(
  key: string,
  from: string,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.cc?.length ? { cc: input.cc } : {}),
      ...(input.bcc?.length ? { bcc: input.bcc } : {}),
      ...(input.attachments?.length
        ? {
            attachments: input.attachments.map((file) => ({
              filename: file.filename,
              content: file.contentBase64,
              contentType: file.contentType,
              inlineContentId: file.contentId,
            })),
          }
        : {}),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export class ResendEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const tenant = await resolveRequestTenant();
    const tenantKey = tenant?.resendApiKey?.trim() ?? "";
    if (tenant && !tenantKey && isPulsarSupabaseConfigured()) {
      return sendThroughPulsarAllowance(tenant.slug, input);
    }

    const key = await resolveResendApiKey();
    if (!key) return { ok: false, error: "RESEND_API_KEY missing" };
    let from: string;
    try {
      from = await resolveResendFromAddress();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
    return deliverWithKey(key, from, input);
  }
}

async function sendThroughPulsarAllowance(
  slug: string,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const account = await loadPulsarOutboundMailAccount();
  const choice = chooseInstituteMailAccount({
    tenantKey: null,
    tenantFrom: null,
    pulsarKey: account?.key ?? null,
    pulsarFrom: account?.from ?? null,
    sent: 0,
    quota: 1,
  });
  if (choice.mode === "blocked") return { ok: false, error: choice.error };

  const reserved = await reservePulsarMailSend(slug);
  if (reserved === "quota") {
    logServerWarn("instituteMail.pulsarQuota", { slug, reason: "pulsar_mail_quota" });
    return { ok: false, error: "pulsar_mail_quota" };
  }
  if (reserved !== "reserved") return { ok: false, error: "RESEND_API_KEY missing" };

  const result = await deliverWithKey(choice.key, choice.from, input);
  if (!result.ok) await releasePulsarMailSend(slug);
  return result;
}
