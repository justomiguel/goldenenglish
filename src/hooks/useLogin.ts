"use client";

import { useState, useEffect } from "react";
import {
  createClient,
  getRememberMePreference,
  setRememberMePreference,
} from "@/lib/supabase/client";

interface LoginErrors {
  invalidCredentials: string;
  emailRequired: string;
  passwordRequired: string;
  generic: string;
}

export interface UseLoginOptions {
  locale: string;
  /** `next` query: internal paths only, e.g. `/es/dashboard/...`. */
  nextPath?: string | null;
}

const LOGIN_LOG_PREFIX = "[goldenenglish:login]";

/** Traces (submit steps, fingerprints): dev by default, or set `NEXT_PUBLIC_DEBUG_LOGIN=true`. */
function loginDiagnosticsVerbose(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_DEBUG_LOGIN === "true";
}

/** Safe for console: no full email, no password. */
function emailFingerprint(raw: string): { length: number; domain: string | null } {
  const t = raw.trim();
  const at = t.indexOf("@");
  if (at <= 0 || at === t.length - 1) return { length: t.length, domain: null };
  return { length: t.length, domain: t.slice(at + 1).toLowerCase() };
}

function loginTrace(event: string, details?: Record<string, unknown>) {
  if (!loginDiagnosticsVerbose()) return;
  console.info(LOGIN_LOG_PREFIX, { event, at: new Date().toISOString(), ...details });
}

function loginFail(event: string, details?: Record<string, unknown>) {
  console.error(LOGIN_LOG_PREFIX, { event, ...details });
}

/** Avoid open redirects: only relative paths without a protocol. */
function safeInternalPath(next: string | null | undefined, locale: string): string {
  const fallback = `/${locale}`;
  if (next == null || next === "") return fallback;
  const t = next.trim();
  if (
    !t.startsWith("/") ||
    t.startsWith("//") ||
    t.includes("://") ||
    t.includes("\\")
  ) {
    return fallback;
  }
  return t;
}

export function useLogin(errorMessages: LoginErrors, options: UseLoginOptions) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRememberMe(getRememberMePreference());
  }, []);

  async function handleSubmit() {
    setError(null);
    setRedirecting(false);

    loginTrace("submit_start", {
      locale: options.locale,
      nextPath: options.nextPath ?? null,
      rememberMe,
      email: emailFingerprint(email),
    });

    if (!email.trim()) {
      loginFail("validation_failed", { reason: "email_required" });
      setError(errorMessages.emailRequired);
      return;
    }

    if (!password) {
      loginFail("validation_failed", {
        reason: "password_required",
        email: emailFingerprint(email),
      });
      setError(errorMessages.passwordRequired);
      return;
    }

    setIsLoading(true);
    let succeeded = false;

    try {
      setRememberMePreference(rememberMe);
      loginTrace("calling_signInWithPassword", { email: emailFingerprint(email) });
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        },
      );

      if (authError) {
        loginFail("supabase_auth_error", {
          message: authError.message,
          code: authError.code,
          status: authError.status,
          name: authError.name,
        });
        const detail =
          authError.message?.trim() &&
          (authError.code
            ? `${authError.message.trim()} (${authError.code})`
            : authError.message.trim());
        setError(detail || errorMessages.invalidCredentials);
        return;
      }

      if (!data.session) {
        loginFail("no_session_after_sign_in", {
          hasUser: Boolean(data.user),
          userIdPresent: Boolean(data.user?.id),
        });
        setError(errorMessages.generic);
        return;
      }

      succeeded = true;
      const target = safeInternalPath(options.nextPath, options.locale);
      loginTrace("sign_in_ok", {
        target,
        sessionExpiresAt: data.session.expires_at ?? null,
      });
      console.info(LOGIN_LOG_PREFIX, {
        event: "redirect_assign",
        target,
        sessionExpiresAt: data.session.expires_at ?? null,
        at: new Date().toISOString(),
      });
      setIsLoading(false);
      setRedirecting(true);
      // Full navigation forces the doc request to carry the session cookies so
      // RSC + proxy see the user (client transitions can revalidate too early).
      window.location.assign(target);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      loginFail("unexpected_throw", {
        name: e.name,
        message: e.message,
        stack: loginDiagnosticsVerbose() ? e.stack : undefined,
      });
      setError(errorMessages.generic);
    } finally {
      if (!succeeded) {
        setIsLoading(false);
      }
    }
  }

  return {
    email,
    password,
    error,
    redirecting,
    isLoading,
    setEmail,
    setPassword,
    rememberMe,
    setRememberMe,
    handleSubmit,
  };
}
