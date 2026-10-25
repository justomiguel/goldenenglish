"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogIn, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminLoginFormProps {
  locale: string;
  dict: Dictionary;
  unauthorizedNotice?: boolean;
}

export function PulsarAdminLoginForm({
  locale,
  dict,
  unauthorizedNotice = false,
}: PulsarAdminLoginFormProps) {
  const router = useRouter();
  const copy = dict.pulsar.admin.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    unauthorizedNotice ? copy.unauthorized : null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!hasSupabasePublicEnv()) {
      setErrorMsg(copy.notConfigured);
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg(copy.invalidCredentials);
        setIsLoading(false);
        return;
      }
      router.push(`/${locale}/admin`);
      router.refresh();
    } catch {
      setErrorMsg(copy.invalidCredentials);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12 text-[var(--color-foreground)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-primary)]">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>

        {errorMsg ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-error)] bg-[var(--color-surface)] p-3 text-xs font-medium text-[var(--color-error)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="pulsar-staff-email"
              className="block text-xs font-semibold text-[var(--color-foreground)]"
            >
              {copy.emailLabel}
            </label>
            <input
              id="pulsar-staff-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)]"
            />
          </div>

          <div>
            <label
              htmlFor="pulsar-staff-password"
              className="block text-xs font-semibold text-[var(--color-foreground)]"
            >
              {copy.passwordLabel}
            </label>
            <input
              id="pulsar-staff-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span>{isLoading ? copy.submitting : copy.submit}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
