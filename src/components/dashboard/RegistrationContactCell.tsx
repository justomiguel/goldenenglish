"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import type { RegistrationContactEntry } from "@/lib/register/resolveRegistrationContact";
import type { Dictionary } from "@/types/i18n";

type RegLabels = Dictionary["admin"]["registrations"];

export interface RegistrationContactCellProps {
  entry: RegistrationContactEntry | null;
  /** Name used in the WhatsApp greeting. */
  contactName: string;
  instituteName: string;
  labels: RegLabels;
}

export function RegistrationContactCell({
  entry,
  contactName,
  instituteName,
  labels,
}: RegistrationContactCellProps) {
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return <span className="text-[var(--color-muted-foreground)]">{labels.emptyValue}</span>;
  }

  const phoneDisplay = entry.phoneDisplay;
  const greeting = labels.whatsAppMessage
    .replaceAll("{name}", contactName)
    .replaceAll("{institute}", instituteName);
  const href = entry.whatsAppDigits
    ? `https://wa.me/${entry.whatsAppDigits}?text=${encodeURIComponent(greeting)}`
    : null;

  async function onCopy() {
    try {
      // The number as the family typed it, so the admin can dial it by hand.
      await navigator.clipboard.writeText(phoneDisplay);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {entry.label ? (
        <span className="break-words text-xs text-[var(--color-muted-foreground)]">
          {entry.label}
        </span>
      ) : null}
      <span className="break-words">{phoneDisplay}</span>
      <div className="flex flex-wrap items-center gap-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels.contactWhatsApp}
            title={labels.contactWhatsApp}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          </a>
        ) : (
          <span
            className="text-xs text-[var(--color-muted-foreground)]"
            title={labels.contactWhatsAppUnavailableTip}
          >
            {labels.contactWhatsAppUnavailable}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={labels.contactCopy}
          title={copied ? labels.contactCopied : labels.contactCopy}
          className="h-8 w-8 shrink-0 border border-[var(--color-border)] bg-[var(--color-surface)] p-0"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
