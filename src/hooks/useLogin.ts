"use client";

import { useState, useEffect } from "react";
import {
  createClient,
  getRememberMePreference,
  setRememberMePreference,
} from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/trackClient";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import {
  LOGIN_LOG_PREFIX,
  identifierFingerprint,
  loginTrace,
  loginFail,
  loginDiagnosticsVerbose,
  safeInternalPath,
  resolveIdentifierToEmail,
} from "@/lib/auth/loginSubmitSupport";

interface LoginErrors {
  invalidCredentials: string;
  identifierRequired: string;
  passwordRequired: string;
  generic: string;
}

export interface UseLoginOptions {
  locale: string;
  /** `next` query: internal paths only, e.g. `/es/dashboard/...`. */
  nextPath?: string | null;
}

export function useLogin(errorMessages: LoginErrors, options: UseLoginOptions) {
  const [identifier, setIdentifier] = useState("");
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

    const fingerprint = identifierFingerprint(identifier);

    loginTrace("submit_start", {
      locale: options.locale,
      nextPath: options.nextPath ?? null,
      rememberMe,
      identifier: fingerprint,
    });

    if (!identifier.trim()) {
      loginFail("validation_failed", { reason: "identifier_required" });
      setError(errorMessages.identifierRequired);
      return;
    }

    if (!password) {
      loginFail("validation_failed", {
        reason: "password_required",
        identifier: fingerprint,
      });
      setError(errorMessages.passwordRequired);
      return;
    }

    setIsLoading(true);
    let succeeded = false;
    const method: "email" | "dni" = fingerprint.kind === "email" ? "email" : "dni";

    try {
      setRememberMePreference(rememberMe);
      loginTrace("resolving_identifier", { identifier: fingerprint });
      const resolvedEmail = await resolveIdentifierToEmail(identifier);
      if (!resolvedEmail) {
        loginFail("identifier_resolution_failed", { identifier: fingerprint });
        setError(errorMessages.invalidCredentials);
        trackEvent("action", AnalyticsEntity.authLogin, {
          method,
          success: false,
          stage: "resolve",
        });
        return;
      }

      loginTrace("calling_signInWithPassword", { identifier: fingerprint, method });
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: resolvedEmail,
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
        trackEvent("action", AnalyticsEntity.authLogin, {
          method,
          success: false,
          stage: "auth",
        });
        return;
      }

      if (!data.session) {
        loginFail("no_session_after_sign_in", {
          hasUser: Boolean(data.user),
          userIdPresent: Boolean(data.user?.id),
        });
        setError(errorMessages.generic);
        trackEvent("action", AnalyticsEntity.authLogin, {
          method,
          success: false,
          stage: "no_session",
        });
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
      trackEvent("action", AnalyticsEntity.authLogin, {
        method,
        success: true,
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
      trackEvent("action", AnalyticsEntity.authLogin, {
        method,
        success: false,
        stage: "throw",
      });
    } finally {
      if (!succeeded) {
        setIsLoading(false);
      }
    }
  }

  return {
    identifier,
    password,
    error,
    redirecting,
    isLoading,
    setIdentifier,
    setPassword,
    rememberMe,
    setRememberMe,
    handleSubmit,
  };
}
