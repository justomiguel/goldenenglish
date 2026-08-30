import { isSyntheticAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { authInviteEmailDomainSuffixForLog } from "@/lib/logging/authInviteAttemptLogMeta";
import { logServerError, logServerInfo, logServerWarn } from "@/lib/logging/serverActionLog";

export type EmailSendLogOutcome = "sent" | "skipped" | "failed";

export function emailSendLogMeta(input: {
  to: string;
  templateKey: string;
  locale: string;
  vars?: Record<string, string>;
}): {
  templateKey: string;
  locale: string;
  toDomain: string;
  toSynthetic: boolean;
  varKeys: string[];
} {
  const normalized = input.to.trim().toLowerCase();
  return {
    templateKey: input.templateKey,
    locale: input.locale,
    toDomain: authInviteEmailDomainSuffixForLog(normalized) ?? "(no_domain)",
    toSynthetic: isSyntheticAuthEmail(normalized),
    varKeys: Object.keys(input.vars ?? {}),
  };
}

/** One `[ge:server] sendBrandedEmail` line per attempt. Never includes the mailbox or var values. */
export function logEmailSendOutcome(input: {
  outcome: EmailSendLogOutcome;
  to: string;
  templateKey: string;
  locale: string;
  vars?: Record<string, string>;
  reason?: string;
  error?: string;
  fromOverride?: boolean;
}): void {
  const payload: Record<string, unknown> = {
    kind: "email_send",
    outcome: input.outcome,
    ...emailSendLogMeta(input),
  };
  if (input.reason) payload.reason = input.reason;
  if (input.error) payload.error = input.error;
  if (input.fromOverride != null) payload.fromOverride = input.fromOverride;

  if (input.outcome === "failed") {
    logServerError("sendBrandedEmail", payload);
    return;
  }
  if (input.outcome === "skipped") {
    logServerWarn("sendBrandedEmail", payload);
    return;
  }
  logServerInfo("sendBrandedEmail", payload);
}
