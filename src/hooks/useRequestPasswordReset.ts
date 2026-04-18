"use client";

import { useState } from "react";
import {
  requestPasswordResetAction,
  type RequestPasswordResetActionState,
} from "@/app/[locale]/forgot-password/actions";
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";

type ForgotErrors = Dictionary["forgotPassword"]["errors"];

export interface UseRequestPasswordResetOptions {
  locale: string;
  errors: ForgotErrors;
  /** Indirection so tests can stub the server action without real Supabase. */
  submit?: (
    locale: string,
    email: string,
  ) => Promise<RequestPasswordResetActionState>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRequestPasswordReset(opts: UseRequestPasswordResetOptions) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError(opts.errors.emailRequired);
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError(opts.errors.emailInvalid);
      return;
    }

    setIsLoading(true);
    try {
      const submitter = opts.submit ?? requestPasswordResetAction;
      const result = await submitter(opts.locale, trimmed);
      if (!result.ok) {
        setError(result.message ?? opts.errors.generic);
        return;
      }
      setSubmittedEmail(trimmed);
    } catch (err) {
      logClientException("useRequestPasswordReset:submit", err);
      setError(opts.errors.generic);
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setSubmittedEmail(null);
    setError(null);
    setEmail("");
  }

  return {
    email,
    setEmail,
    error,
    isLoading,
    submittedEmail,
    handleSubmit,
    reset,
  };
}
