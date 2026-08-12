import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "@/lib/email/emailProvider";

/**
 * Next.js can evaluate this module in more than one server bundle (route handlers
 * vs server actions). Keep the log on `globalThis` so GET/DELETE `/api/e2e/recorded-emails`
 * sees the same array that `RecordingEmailProvider.sendEmail` appends to.
 */
const GLOBAL_KEY = "__ge_e2e_recorded_emails__";

type GlobalEmailBag = typeof globalThis & {
  [GLOBAL_KEY]?: SendEmailInput[];
};

function recordedStore(): SendEmailInput[] {
  const g = globalThis as GlobalEmailBag;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = [];
  return g[GLOBAL_KEY];
}

export function getRecordedEmails(): readonly SendEmailInput[] {
  return recordedStore().slice();
}

export function clearRecordedEmails(): void {
  recordedStore().length = 0;
}

/**
 * E2E / harness adapter: succeeds without calling Resend and keeps an in-memory log.
 */
export class RecordingEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    recordedStore().push({
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true };
  }
}
