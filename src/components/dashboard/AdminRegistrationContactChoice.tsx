"use client";

import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationInfoTip } from "@/components/dashboard/AdminRegistrationInfoTip";
import type { Dictionary } from "@/types/i18n";

type FunnelLabels = Dictionary["admin"]["registrations"]["funnel"];

export function AdminRegistrationContactChoice({
  labels,
  infoLabel,
  whatsAppLabel,
  callLabel,
  disabled,
  whatsAppHref,
  callHref,
  onMail,
}: {
  labels: FunnelLabels;
  infoLabel: string;
  whatsAppLabel: string;
  callLabel: string;
  disabled: boolean;
  whatsAppHref: string | null;
  callHref: string | null;
  onMail: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-stretch gap-3">
        <img
          src="/images/dashboard/registration-contact.jpg"
          alt={labels.contactImageAlt}
          width={640}
          height={640}
          data-contact-figure
          className="h-36 w-36 shrink-0 rounded-[var(--layout-border-radius)] object-cover"
        />
        <div data-contact-actions className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <h3 className="text-sm font-medium text-[var(--color-foreground)]">{labels.contactChoose}</h3>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 min-w-0 flex-1"
              disabled={disabled}
              onClick={onMail}
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {labels.sendMail}
            </Button>
            <AdminRegistrationInfoTip text={labels.mailTip} label={infoLabel} />
          </div>
          {whatsAppHref ? (
            <>
              <span className="text-center text-sm font-medium text-[var(--color-muted-foreground)]">
                {labels.contactOr}
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={whatsAppHref}
                  className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                  {whatsAppLabel}
                </a>
                <AdminRegistrationInfoTip text={labels.whatsappTip} label={infoLabel} />
              </div>
            </>
          ) : null}
          {callHref ? (
            <>
              <span className="text-center text-sm font-medium text-[var(--color-muted-foreground)]">
                {labels.contactOr}
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={callHref}
                  className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  {callLabel}
                </a>
                <AdminRegistrationInfoTip text={labels.callTip} label={infoLabel} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
