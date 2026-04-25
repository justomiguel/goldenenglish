import { Resend } from "resend";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/emailProvider";

function fromAddress(): string {
  const f = process.env.RESEND_FROM_EMAIL?.trim();
  if (f) return f;
  throw new Error("RESEND_FROM_EMAIL is required for outbound mail");
}

export class ResendEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      return { ok: false, error: "RESEND_API_KEY missing" };
    }
    let from: string;
    try {
      from = fromAddress();
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
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}
