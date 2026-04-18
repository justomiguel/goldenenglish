import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrandPublic } from "@/lib/brand/server";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { sendPasswordResetEmail } from "@/lib/auth/sendPasswordResetEmail";
import {
  logServerActionInvariantViolation,
  logServerException,
} from "@/lib/logging/serverActionLog";

/**
 * Loose RFC 5322-friendly check; the canonical validation happens at Supabase
 * Auth when we ask for a recovery link. Server actions still validate to avoid
 * useless round-trips and to short-circuit malformed inputs.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidResetEmail(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 3 || t.length > 254) return false;
  return EMAIL_RE.test(t);
}

export type RequestPasswordResetOutcome =
  | { ok: true }
  | { ok: false; reason: "invalid_email" };

export interface RequestPasswordResetParams {
  email: string;
  locale: string;
  /** Absolute URL the recovery link should redirect to after Supabase verifies it. */
  redirectTo: string;
  brand: BrandPublic;
  adminClient: SupabaseClient;
  emailProvider: EmailProvider;
}

/**
 * Trigger the "forgot password" flow:
 *
 *  1. Ask Supabase admin for a recovery link (this does NOT send an email by
 *     itself — that is the whole point of `generateLink` vs the deprecated
 *     auto-mail path).
 *  2. Deliver the link via our `EmailProvider` (Resend in production), with
 *     branded HTML pulled from the dictionary.
 *
 * The function deliberately returns `{ ok: true }` even when the email is not
 * registered: leaking existence would let an attacker enumerate users (OWASP
 * A07/A04). All anomalies are logged server-side via `[ge:server]`.
 */
export async function requestPasswordReset(
  params: RequestPasswordResetParams,
): Promise<RequestPasswordResetOutcome> {
  const email = params.email.trim();
  if (!isValidResetEmail(email)) {
    return { ok: false, reason: "invalid_email" };
  }

  let actionLink: string | null = null;
  try {
    const { data, error } = await params.adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: params.redirectTo },
    });
    if (error) {
      // Most "user not found" errors land here. Do not expose to the client.
      logServerActionInvariantViolation(
        "requestPasswordReset:generateLink",
        error.message ?? "generateLink_error",
        { code: error.status ?? null },
      );
      return { ok: true };
    }
    actionLink = data.properties?.action_link ?? null;
  } catch (err) {
    logServerException("requestPasswordReset:generateLink_throw", err);
    return { ok: true };
  }

  if (!actionLink) return { ok: true };

  try {
    const result = await sendPasswordResetEmail({
      to: email,
      resetLink: actionLink,
      brand: params.brand,
      locale: params.locale,
      emailProvider: params.emailProvider,
    });
    if (!result.ok) {
      logServerActionInvariantViolation(
        "requestPasswordReset:sendEmail",
        result.error,
      );
    }
  } catch (err) {
    logServerException("requestPasswordReset:sendEmail_throw", err);
  }

  return { ok: true };
}
