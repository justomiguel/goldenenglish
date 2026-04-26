"use client";

import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRequestPasswordReset } from "@/hooks/useRequestPasswordReset";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { fillTemplate } from "@/lib/i18n/fillTemplate";
import type { Dictionary } from "@/types/i18n";

interface ForgotPasswordFormProps {
  labels: Dictionary["forgotPassword"];
  locale: string;
}

export function ForgotPasswordForm({ labels, locale }: ForgotPasswordFormProps) {
  const {
    email,
    setEmail,
    error,
    isLoading,
    submittedEmail,
    handleSubmit,
    reset,
  } = useRequestPasswordReset({
    locale,
    errors: labels.errors,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  if (submittedEmail) {
    return (
      <div className="w-full space-y-6 text-left">
        <div className="space-y-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            {labels.kicker}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[2rem] sm:leading-tight">
            {labels.successTitle}
          </h1>
          <p
            className="text-pretty text-sm leading-relaxed text-[var(--color-muted-foreground)]"
            role="status"
            aria-live="polite"
          >
            {fillTemplate(labels.successBody, { email: submittedEmail })}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={reset}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            {labels.resend}
          </Button>
          <Link
            href={`/${locale}/login`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-base font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)] sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {labels.backToLogin}
          </Link>
        </div>
      </div>
    );
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full shadow-[0_8px_28px_-8px_rgb(16_58_92_/45%)] transition hover:brightness-[1.03] active:brightness-[0.98]"
      >
        {!isLoading ? <Mail className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {isLoading ? labels.submitting : labels.submitButton}
      </Button>

      <div className="text-left text-sm">
        <Link
          href={`/${locale}/login`}
          className="font-medium text-[var(--color-primary)] underline-offset-4 transition hover:underline"
        >
          {labels.backToLogin}
        </Link>
      </div>
    </form>
  );
}
