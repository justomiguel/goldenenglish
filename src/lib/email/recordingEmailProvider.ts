import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "@/lib/email/emailProvider";

const recorded: SendEmailInput[] = [];

export function getRecordedEmails(): readonly SendEmailInput[] {
  return recorded.slice();
}

export function clearRecordedEmails(): void {
  recorded.length = 0;
}

/**
 * E2E / harness adapter: succeeds without calling Resend and keeps an in-memory log.
 */
export class RecordingEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    recorded.push({
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true };
  }
}
