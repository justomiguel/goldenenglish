"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { resolvePulsarPostLoginPath } from "@/app/[locale]/admin/sessionActions";
import { registerPulsarOwnerAction } from "@/app/[locale]/cuenta/actions";
import { Button } from "@/components/atoms/Button";
import { useAppSurface } from "@/hooks/useAppSurface";
import { createPulsarBrowserClient } from "@/lib/supabase/pulsarBrowser";
import type { Dictionary } from "@/types/i18n";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base text-[var(--color-foreground)]";

export function PulsarAccountAuthForm({
  locale,
  mode,
  copy,
  nextPath,
}: {
  locale: string;
  mode: "login" | "register";
  copy: Dictionary["pulsar"]["account"];
  nextPath: string;
}) {
  const router = useRouter();
  const narrow = useAppSurface() !== "web-desktop";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    try {
      if (mode === "register") {
        const created = await registerPulsarOwnerAction({ email, password, locale });
        if (!created.ok) {
          setError(created.errorCode === "email_taken" ? copy.emailTaken : copy.invalidInput);
          return;
        }
      }
      const supabase = createPulsarBrowserClient();
      const signed = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signed.error) {
        setError(copy.invalidInput);
        return;
      }
      const path = await resolvePulsarPostLoginPath(locale, nextPath);
      router.push(path);
      router.refresh();
    } catch {
      setError(copy.invalidInput);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`mx-auto max-w-md space-y-4 px-5 py-10 ${narrow ? "pb-28" : ""}`}>
      <h1 className="text-2xl font-medium">{mode === "register" ? copy.registerTitle : copy.loginTitle}</h1>
      <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {mode === "register" ? copy.registerLead : copy.loginLead}
      </p>
      <label className="block text-sm font-semibold" htmlFor="account-email">
        {copy.email}
        <input id="account-email" name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="account-password">
        {copy.password}
        <input
          id="account-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className={fieldClass}
        />
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button
        type="submit"
        isLoading={pending}
        className={
          narrow
            ? "fixed inset-x-4 z-30 min-h-11"
            : "min-h-11 w-full"
        }
        style={narrow ? { bottom: "max(1rem, env(safe-area-inset-bottom))" } : undefined}
      >
        {mode === "register" ? <UserPlus className="h-4 w-4" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
        {mode === "register" ? copy.submitRegister : copy.submitLogin}
      </Button>
    </form>
  );
}
