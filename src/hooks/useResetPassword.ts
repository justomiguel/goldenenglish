"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/trackClient";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";
import { parseAuthRedirectParams } from "@/lib/auth/parseAuthRedirectParams";
import { clearMustChangePasswordFlagAction } from "@/app/[locale]/reset-password/clearMustChangePasswordAction";
import {
  stripTrailingSlash,
  replaceUrlWithoutRecoveryAuthParams,
} from "@/lib/auth/resetPasswordUrlCleanup";

type ResetErrors = Dictionary["resetPassword"]["errors"];

export interface UseResetPasswordOptions {
  locale: string;
  errors: ResetErrors;
  /**
   * If `true`, the hook does not navigate after success. Used by tests; the
   * production form lets `window.location.assign` carry the fresh session
   * cookies into the next document request.
   */
  skipRedirect?: boolean;
  /**
   * When `code` is present on `/{locale}/reset-password`, skip the automatic
   * redirect to `/api/auth/recovery-callback` (tests only).
   */
  skipRecoveryCodeRedirect?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

type LinkStatus = "verifying" | "ready" | "invalid";

export function useResetPassword(opts: UseResetPasswordOptions) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("verifying");
  /**
   * True when the form is showing because the admin reset the user's password
   * via the "Reset by DNI" flow (app_metadata.must_change_password === true on
   * the active session) — used to render a "you must pick a new password"
   * banner instead of the recovery-link copy.
   */
  const [mustChangeBanner, setMustChangeBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function establishRecoverySession() {
      const params = parseAuthRedirectParams(window.location.href);
      const pathname = stripTrailingSlash(window.location.pathname);
      const isLocaleResetPage =
        pathname === "/en/reset-password" || pathname === "/es/reset-password";

      if (
        params.code &&
        isLocaleResetPage &&
        !opts.skipRecoveryCodeRedirect
      ) {
        window.location.replace(
          `/api/auth/recovery-callback?code=${encodeURIComponent(params.code)}&next=${encodeURIComponent(pathname)}`,
        );
        return;
      }

      const hasAuthParams = Boolean(
        params.code ||
          (params.token_hash && params.type === "recovery") ||
          (params.access_token && params.refresh_token),
      );

      const supabase = createClient();

      try {
        if (params.token_hash && params.type === "recovery") {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: "recovery",
          });
          if (cancelled) return;
          if (verifyErr) {
            setLinkStatus("invalid");
            setError(opts.errors.expiredLink);
            return;
          }
          replaceUrlWithoutRecoveryAuthParams();
          setLinkStatus("ready");
          return;
        }

        if (params.access_token && params.refresh_token) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (cancelled) return;
          if (sessionErr) {
            setLinkStatus("invalid");
            setError(opts.errors.expiredLink);
            return;
          }
          replaceUrlWithoutRecoveryAuthParams();
          setLinkStatus("ready");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          const flag =
            (session.user as { app_metadata?: { must_change_password?: boolean } } | null)
              ?.app_metadata?.must_change_password === true;
          setMustChangeBanner(flag);
          setLinkStatus("ready");
          return;
        }

        setLinkStatus("invalid");
        setError(hasAuthParams ? opts.errors.expiredLink : opts.errors.missingCode);
      } catch (err) {
        logClientException("useResetPassword:establishRecoverySession", err);
        if (cancelled) return;
        setLinkStatus("invalid");
        setError(opts.errors.expiredLink);
      }
    }

    void establishRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [
    opts.errors.expiredLink,
    opts.errors.missingCode,
    opts.skipRecoveryCodeRedirect,
  ]);

  async function handleSubmit() {
    setError(null);

    if (linkStatus !== "ready") {
      setError(opts.errors.expiredLink);
      return;
    }

    if (!password) {
      setError(opts.errors.passwordRequired);
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(opts.errors.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(opts.errors.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        logClientException("useResetPassword:updateUser", updateError, {
          code: updateError.code,
        });
        setError(opts.errors.updateFailed);
        return;
      }

      trackEvent("action", AnalyticsEntity.passwordResetCompleted, {});

      try {
        await clearMustChangePasswordFlagAction();
        if (mustChangeBanner) {
          trackEvent(
            "action",
            AnalyticsEntity.passwordChangeRequiredCleared,
            {},
          );
        }
      } catch (err) {
        logClientException("useResetPassword:clearMustChangeFlag", err);
      }

      setSuccess(true);
      if (!opts.skipRedirect) {
        window.location.assign(`/${opts.locale}/dashboard`);
      }
    } catch (err) {
      logClientException("useResetPassword:submit_throw", err);
      setError(opts.errors.generic);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    password,
    confirm,
    error,
    isLoading,
    success,
    linkStatus,
    mustChangeBanner,
    setPassword,
    setConfirm,
    handleSubmit,
  };
}
