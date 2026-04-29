"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requestPasswordReset } from "@/lib/auth/requestPasswordReset";
import { checkPasswordResetRateLimit } from "@/lib/auth/passwordResetRateLimit";

export type RequestPasswordResetActionState =
  | { ok: true }
  | { ok: false; message: string };

function clientIpFromHeaders(h: Headers): string | null {
  const xf = h.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

/**
 * Recovery links must land on `/api/auth/recovery-callback` so the auth code is
 * exchanged on the server into session cookies (browser PKCE client cannot
 * complete `exchangeCodeForSession` without a prior code_verifier).
 */
function buildRecoveryRedirectTo(locale: string): string {
  const base =
    getPublicSiteUrl()?.toString().replace(/\/$/, "") ?? "http://localhost:3000";
  const nextPath = `/${locale}/reset-password`;
  return `${base}/api/auth/recovery-callback?next=${encodeURIComponent(nextPath)}`;
}

export async function requestPasswordResetAction(
  locale: string,
  rawEmail: string,
): Promise<RequestPasswordResetActionState> {
  const dict = await getDictionary(locale);
  const errors = dict.forgotPassword.errors;
  const email = rawEmail.trim();

  if (!email) {
    return { ok: false, message: errors.emailRequired };
  }

  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limit = checkPasswordResetRateLimit({ ip, email });
  if (!limit.allowed) {
    return { ok: false, message: errors.rateLimited };
  }

  const result = await requestPasswordReset({
    email,
    locale,
    redirectTo: buildRecoveryRedirectTo(locale),
    brand: await getBrandForRequest(),
    adminClient: createAdminClient(),
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: errors.emailInvalid };
  }
  return { ok: true };
}
