"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { getBrandForRequest } from "@/lib/brand/server";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requestPasswordReset } from "@/lib/auth/requestPasswordReset";
import { checkPasswordResetRateLimit } from "@/lib/auth/passwordResetRateLimit";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

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
async function buildRecoveryRedirectTo(locale: string): Promise<string> {
  const base =
    (await getRequestPublicSiteUrl())?.toString().replace(/\/$/, "") ?? "http://localhost:3000";
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

  const [h, tenant] = await Promise.all([headers(), resolveRequestTenant()]);
  const ip = clientIpFromHeaders(h);
  const limit = checkPasswordResetRateLimit({ ip, email, tenantSlug: tenant?.slug });
  if (!limit.allowed) {
    return { ok: false, message: errors.rateLimited };
  }

  const result = await requestPasswordReset({
    email,
    locale,
    redirectTo: await buildRecoveryRedirectTo(locale),
    brand: await getBrandForRequest(),
    adminClient: await createAdminClient(),
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: errors.emailInvalid };
  }
  return { ok: true };
}
