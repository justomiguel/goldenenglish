import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRecoveryRedirectPath } from "@/lib/auth/safeRecoveryRedirectPath";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * Supabase redirects here with `?code=` (PKCE) or `token_hash`/`type=recovery`
 * after the user clicks the recovery link. Session cookies must be written on
 * the server — the browser PKCE client cannot complete `exchangeCodeForSession`
 * without a prior code_verifier stored from an in-browser OAuth start.
 *
 * Add this URL to Supabase Dashboard → Authentication → URL Configuration →
 * Redirect URLs (including `http://localhost:3000/api/auth/recovery-callback`
 * for local dev).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const recoveryType = url.searchParams.get("type");
  const safeNext = safeRecoveryRedirectPath(url.searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && recoveryType === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) {
      logServerException("recoveryCallback:verifyOtp", error);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logServerException("recoveryCallback:exchangeCodeForSession", error);
    }
  }

  const redirectUrl = new URL(safeNext, url.origin);
  const res = NextResponse.redirect(redirectUrl);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
