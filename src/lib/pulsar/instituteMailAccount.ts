export const DEFAULT_PULSAR_MAIL_QUOTA = 50;
export const MAX_PULSAR_MAIL_QUOTA = 100_000;

export type InstituteMailBlock =
  | "RESEND_API_KEY missing"
  | "RESEND_FROM_EMAIL is required for outbound mail"
  | "pulsar_mail_quota";

export type InstituteMailChoice =
  | { mode: "tenant"; key: string; from: string }
  | { mode: "pulsar"; key: string; from: string }
  | { mode: "blocked"; error: InstituteMailBlock };

export function parsePulsarMailQuota(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return DEFAULT_PULSAR_MAIL_QUOTA;
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  if (!/^\d+$/u.test(text)) return null;
  const value = Number(text);
  if (value > MAX_PULSAR_MAIL_QUOTA) return null;
  return value;
}

export function chooseInstituteMailAccount(input: {
  tenantKey: string | null;
  tenantFrom: string | null;
  pulsarKey: string | null;
  pulsarFrom: string | null;
  sent: number;
  quota: number;
}): InstituteMailChoice {
  const tenantKey = input.tenantKey?.trim() ?? "";
  const tenantFrom = input.tenantFrom?.trim() ?? "";
  if (tenantKey) {
    if (!tenantFrom) {
      return { mode: "blocked", error: "RESEND_FROM_EMAIL is required for outbound mail" };
    }
    return { mode: "tenant", key: tenantKey, from: tenantFrom };
  }

  const pulsarKey = input.pulsarKey?.trim() ?? "";
  const pulsarFrom = input.pulsarFrom?.trim() ?? "";
  if (!pulsarKey) return { mode: "blocked", error: "RESEND_API_KEY missing" };
  if (!pulsarFrom) {
    return { mode: "blocked", error: "RESEND_FROM_EMAIL is required for outbound mail" };
  }
  if (input.sent >= input.quota) return { mode: "blocked", error: "pulsar_mail_quota" };
  return { mode: "pulsar", key: pulsarKey, from: pulsarFrom };
}
