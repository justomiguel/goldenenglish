"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Send } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { submitPublicContactForm } from "@/app/[locale]/contact/actions";
import type { PublicSiteContactSubject } from "@/lib/messaging/publicSiteContactSubjects";

export interface PublicContactFormProps {
  locale: string;
  labels: Dictionary["publicContact"];
  /** Success UI scrolls/forms stay on-page (landing embeds); default navigates via “back home”. */
  embedded?: boolean;
}

export function PublicContactForm({
  locale,
  labels,
  embedded = false,
}: PublicContactFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<PublicSiteContactSubject>("classes");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await submitPublicContactForm(locale, {
      fullName,
      email,
      phone,
      subject,
      body,
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      return;
    }
    setMessage(res.message);
  }

  function resetAfterSuccess() {
    setDone(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setSubject("classes");
    setBody("");
    setMessage(null);
  }

  if (done) {
    if (embedded) {
      return (
        <div className="space-y-6 text-center">
          <p className="text-[var(--color-foreground)]">{labels.success}</p>
          <button
            type="button"
            onClick={resetAfterSuccess}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
            {labels.sendAnother}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-6 text-center">
        <p className="text-[var(--color-foreground)]">{labels.success}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-primary)]"
        >
          {labels.backHome}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-lg space-y-4 text-left">
      <div>
        <Label htmlFor="pc-name" required>
          {labels.fullName}
        </Label>
        <Input
          id="pc-name"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={labels.fullNamePlaceholder}
          disabled={busy}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="pc-email" required>
          {labels.email}
        </Label>
        <Input
          id="pc-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.emailPlaceholder}
          disabled={busy}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="pc-phone">{labels.phone}</Label>
        <Input
          id="pc-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={labels.phonePlaceholder}
          disabled={busy}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="pc-subject" required>
          {labels.subject}
        </Label>
        <select
          id="pc-subject"
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value as PublicSiteContactSubject)}
          disabled={busy}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:opacity-50"
        >
          <option value="classes">{labels.subjectClasses}</option>
          <option value="prices">{labels.subjectPrices}</option>
          <option value="modalities">{labels.subjectModalities}</option>
          <option value="other">{labels.subjectOther}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="pc-body" required>
          {labels.message}
        </Label>
        <textarea
          id="pc-body"
          name="body"
          required
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={labels.messagePlaceholder}
          disabled={busy}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:opacity-50"
        />
      </div>
      <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px] w-full sm:w-auto" title={labels.submit}>
        {busy ? null : <Send className="h-4 w-4 shrink-0" aria-hidden />}
        {busy ? labels.submitting : labels.submit}
      </Button>
      {message ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
