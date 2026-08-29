"use client";

import type { FormEvent, ReactNode } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";

export function AdminComposeShell({
  title,
  recipientSlot,
  subject,
  modeSlot,
  summary,
  body,
  onBodyChange,
  onSubmit,
  busy,
  message,
  submitLabel,
  submitDisabled,
  bodyAriaLabel,
}: {
  title: string;
  recipientSlot: ReactNode;
  subject?: { id: string; label: string; value: string; onChange: (v: string) => void };
  modeSlot?: ReactNode;
  summary?: ReactNode;
  body: string;
  onBodyChange: (html: string) => void;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  message: string | null;
  submitLabel: string;
  submitDisabled?: boolean;
  bodyAriaLabel: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 overflow-visible rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] md:p-6"
    >
      <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">{title}</h2>
      {recipientSlot}
      {subject ? (
        <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor={subject.id}>
          {subject.label}
          <Input
            id={subject.id}
            value={subject.value}
            onChange={(e) => subject.onChange(e.target.value)}
            disabled={busy}
            className="mt-1"
          />
        </label>
      ) : null}
      {modeSlot}
      {summary}
      <RichTextEditor value={body} onChange={onBodyChange} disabled={busy} aria-label={bodyAriaLabel} />
      <Button type="submit" disabled={busy || submitDisabled} isLoading={busy} className="min-h-[44px]">
        {busy ? null : <Send className="h-4 w-4 shrink-0" aria-hidden />}
        {submitLabel}
      </Button>
      {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
    </form>
  );
}
