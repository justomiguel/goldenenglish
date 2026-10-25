import { Resend } from "resend";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { preferTenantValue } from "@/lib/tenant/preferTenantValue";
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

export class ResendEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const key = await resolveResendApiKey();
    if (!key) {
      return { ok: false, error: "RESEND_API_KEY missing" };
    }
    let from: string;
    try {
      from = await resolveResendFromAddress();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
    try {
      const resend = new Resend(key);
      const { error } = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.cc?.length ? { cc: input.cc } : {}),
        ...(input.bcc?.length ? { bcc: input.bcc } : {}),
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}
