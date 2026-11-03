"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { submitGenericLandingContactAction } from "@/app/[locale]/contact/freeSiteContactAction";
import { Button } from "@/components/atoms/Button";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base text-[var(--color-foreground)]";

export interface GenericLandingContactFormLabels {
  formName: string;
  formEmail: string;
  formPhone: string;
  formMessage: string;
  formSuccess: string;
  formPreview: string;
  formQuota: string;
  formInvalid: string;
  formPersist: string;
  formUnavailable: string;
}

function errorText(code: string, labels: GenericLandingContactFormLabels): string {
  if (code === "preview") return labels.formPreview;
  if (code === "quota") return labels.formQuota;
  if (code === "invalid") return labels.formInvalid;
  if (code === "unavailable") return labels.formUnavailable;
  return labels.formPersist;
}

export function GenericLandingContactForm({
  locale,
  labels,
  submitLabel,
}: {
  locale: string;
  labels: GenericLandingContactFormLabels;
  submitLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await submitGenericLandingContactAction({
      locale,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(errorText(result.errorCode, labels));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-8 text-base text-[var(--color-foreground)]" role="status">
        {labels.formSuccess}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold" htmlFor="visit-name">
        {labels.formName}
        <input id="visit-name" name="name" required maxLength={120} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="visit-email">
        {labels.formEmail}
        <input id="visit-email" name="email" type="email" required maxLength={200} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="visit-phone">
        {labels.formPhone}
        <input id="visit-phone" name="phone" type="tel" maxLength={40} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="visit-message">
        {labels.formMessage}
        <textarea id="visit-message" name="message" required maxLength={4000} rows={4} className={fieldClass} />
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Send className="h-4 w-4" aria-hidden />
        {submitLabel}
      </Button>
    </form>
  );
}
