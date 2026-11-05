import { DEFAULT_PULSAR_MAIL_QUOTA } from "@/lib/pulsar/instituteMailAccount";
import { logServerError, logServerWarn } from "@/lib/logging/serverActionLog";

export const RESEND_USAGE_URL = "https://api.resend.com/usage";
const USAGE_TIMEOUT_MS = 4_000;

export type MailMonthCounts = { used: number; limit: number | null };

export type MailMonthReadout =
  | ({ source: "resend" } & MailMonthCounts)
  | { source: "pulsar"; used: number; limit: number }
  | { source: "unread" };

export type MailMonthTenant = {
  slug: string;
  resendApiKey: string | null;
  pulsarMailSent?: number;
  pulsarMailQuota?: number;
};

function whole(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) return null;
  return Math.floor(raw);
}

export function readResendMonthlyMail(body: unknown): MailMonthCounts | null {
  if (!body || typeof body !== "object") return null;
  const emails = (body as { emails?: unknown }).emails;
  if (!emails || typeof emails !== "object") return null;
  const monthly = (emails as { monthly?: unknown }).monthly;
  if (!monthly || typeof monthly !== "object") return null;
  const used = whole((monthly as { used?: unknown }).used);
  if (used == null) return null;
  const limitRaw = (monthly as { limit?: unknown }).limit;
  if (limitRaw == null) return { used, limit: null };
  const limit = whole(limitRaw);
  if (limit == null) return null;
  return { used, limit };
}

export function mailMonthFromTenant(input: {
  resendApiKey: string | null;
  usage: MailMonthCounts | "unread" | null;
  pulsarMailSent?: number;
  pulsarMailQuota?: number;
}): MailMonthReadout {
  const key = input.resendApiKey?.trim() ?? "";
  if (!key) {
    return {
      source: "pulsar",
      used: input.pulsarMailSent ?? 0,
      limit: input.pulsarMailQuota ?? DEFAULT_PULSAR_MAIL_QUOTA,
    };
  }
  if (!input.usage || input.usage === "unread") return { source: "unread" };
  return { source: "resend", used: input.usage.used, limit: input.usage.limit };
}

export async function fetchResendMonthlyMail(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<MailMonthCounts | "unread"> {
  const key = apiKey.trim();
  if (!key) return "unread";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), USAGE_TIMEOUT_MS);
  try {
    const res = await fetchImpl(RESEND_USAGE_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      await logServerWarn("resend.usage", { status: res.status });
      return "unread";
    }
    const parsed = readResendMonthlyMail(await res.json());
    if (!parsed) {
      await logServerWarn("resend.usage", { status: res.status, code: "invalid_body" });
      return "unread";
    }
    return parsed;
  } catch {
    await logServerError("resend.usage", { step: "fetch" });
    return "unread";
  } finally {
    clearTimeout(timer);
  }
}

export async function loadFleetMailMonth(
  tenants: readonly MailMonthTenant[],
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, MailMonthReadout>> {
  const keys = new Set<string>();
  for (const tenant of tenants) {
    const key = tenant.resendApiKey?.trim() ?? "";
    if (key) keys.add(key);
  }
  const usageByKey = new Map<string, MailMonthCounts | "unread">();
  await Promise.all(
    [...keys].map(async (key) => {
      usageByKey.set(key, await fetchResendMonthlyMail(key, fetchImpl));
    }),
  );
  const out: Record<string, MailMonthReadout> = {};
  for (const tenant of tenants) {
    const key = tenant.resendApiKey?.trim() ?? "";
    out[tenant.slug] = mailMonthFromTenant({
      resendApiKey: tenant.resendApiKey,
      usage: key ? (usageByKey.get(key) ?? "unread") : null,
      pulsarMailSent: tenant.pulsarMailSent,
      pulsarMailQuota: tenant.pulsarMailQuota,
    });
  }
  return out;
}
