"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/trackClient";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";

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
}

const MIN_PASSWORD_LENGTH = 8;

type LinkStatus = "verifying" | "ready" | "invalid";

function readCodeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code && code.length > 0) return code;
  if (url.hash.startsWith("#")) {
    const params = new URLSearchParams(url.hash.slice(1));
    const fromHash = params.get("code");
    if (fromHash) return fromHash;
  }
  return null;
}

export function useResetPassword(opts: UseResetPasswordOptions) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("verifying");
  const exchangeRanRef = useRef(false);

  useEffect(() => {
    if (exchangeRanRef.current) return;
    exchangeRanRef.current = true;

    const code = readCodeFromLocation();
    if (!code) {
      setLinkStatus("invalid");
      setError(opts.errors.missingCode);
      return;
    }
    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          setLinkStatus("invalid");
          setError(opts.errors.expiredLink);
          return;
        }
        setLinkStatus("ready");
      })
      .catch((err) => {
        logClientException("useResetPassword:exchangeCodeForSession", err);
        setLinkStatus("invalid");
        setError(opts.errors.expiredLink);
      });
  }, [opts.errors.missingCode, opts.errors.expiredLink]);

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
    setPassword,
    setConfirm,
    handleSubmit,
  };
}
