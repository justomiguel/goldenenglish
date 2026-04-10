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
  /** Query `next`: solo rutas internas, p. ej. /es/dashboard/... */
  nextPath?: string | null;
}

/** Evita open-redirect: solo paths relativos sin protocolo. */
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

    if (!email.trim()) {
      setError(errorMessages.emailRequired);
      return;
    }

    if (!password) {
      setError(errorMessages.passwordRequired);
      return;
    }

    setIsLoading(true);
    let succeeded = false;

    try {
      setRememberMePreference(rememberMe);
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        },
      );

      if (authError) {
        console.error("[login] Supabase auth error:", {
          message: authError.message,
          code: authError.code,
          status: authError.status,
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
        setError(errorMessages.generic);
        return;
      }

      succeeded = true;
      const target = safeInternalPath(options.nextPath, options.locale);
      setIsLoading(false);
      setRedirecting(true);
      // Full navigation forces the doc request to carry the session cookies so
      // RSC + proxy see the user (client transitions can revalidate too early).
      window.location.assign(target);
    } catch (err) {
      console.error("[login] Unexpected error:", err);
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
