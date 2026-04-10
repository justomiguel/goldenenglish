"use client";

import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import Link from "next/link";

interface LoginFormProps {
  labels: Dictionary["login"];
  locale: string;
  /** Origen: query `next` en la página de login (ruta interna). */
  nextPath?: string | null;
}

export function LoginForm({ labels, locale, nextPath = null }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
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
  } = useLogin(labels.errors, { locale, nextPath });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full space-y-7">
      <div className="space-y-3 text-left">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {labels.kicker}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[2rem] sm:leading-tight">
          {labels.title}
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {labels.subtitle}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_9%,var(--color-surface))] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {error}
        </div>
      ) : null}

      {redirecting ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
        >
          {labels.redirecting}
        </p>
      ) : null}

      <div className="space-y-5">
        <FormField
          label={labels.emailLabel}
          type="email"
          placeholder={labels.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.75)]"
        />

        <FormField
          label={labels.passwordLabel}
          type={showPassword ? "text" : "password"}
          placeholder={labels.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.75)]"
          footer={
            <div className="flex justify-end pt-1">
              <button
                type="button"
                className="text-sm font-medium text-[var(--color-primary)] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-sm"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={
                  showPassword ? labels.hidePassword : labels.showPassword
                }
              >
                {showPassword ? labels.hidePassword : labels.showPassword}
              </button>
            </div>
          }
        />

        <label className="flex cursor-pointer items-center gap-3 text-left text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
          />
          <span>{labels.rememberMe}</span>
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full shadow-[0_8px_28px_-8px_rgb(16_58_92_/45%)] transition hover:brightness-[1.03] active:brightness-[0.98]"
      >
        {labels.submitButton}
      </Button>

      <div className="text-left text-sm">
        <Link
          href={`/${locale}/forgot-password`}
          className="font-medium text-[var(--color-primary)] underline-offset-4 transition hover:underline"
        >
          {labels.forgotPassword}
        </Link>
      </div>
    </form>
  );
}
