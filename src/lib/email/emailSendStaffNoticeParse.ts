export const EMAIL_SEND_LAST_FAILURE_KEY = "email_send_last_failure";

export const EMAIL_SEND_STAFF_NOTICE_REASONS = ["provider_error", "unknown_template_key"] as const;

export type EmailSendStaffNoticeReason = (typeof EMAIL_SEND_STAFF_NOTICE_REASONS)[number];

export type EmailSendLastFailure = {
  at: string;
  templateKey: string;
  reason: EmailSendStaffNoticeReason;
  dismissedAt: string | null;
};

export function parseEmailSendLastFailure(raw: unknown): EmailSendLastFailure | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const at = typeof row.at === "string" ? row.at : "";
  const templateKey = typeof row.templateKey === "string" ? row.templateKey : "";
  const reason = row.reason;
  if (!at || !templateKey) return null;
  if (reason !== "provider_error" && reason !== "unknown_template_key") return null;
  const dismissedAt = typeof row.dismissedAt === "string" && row.dismissedAt ? row.dismissedAt : null;
  return { at, templateKey, reason, dismissedAt };
}

export function emailSendStaffNoticeIsActive(raw: unknown): boolean {
  const parsed = parseEmailSendLastFailure(raw);
  return Boolean(parsed && !parsed.dismissedAt);
}
