"use client";

import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

type ReviewL = Dictionary["dashboard"]["siteSetup"]["review"];

interface SiteSetupReviewStepProps {
  labels: ReviewL;
  appName: string;
  legalName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
}

export function SiteSetupReviewStep({
  labels,
  appName,
  legalName,
  tagline,
  contactEmail,
  contactPhone,
  contactAddress,
  socialFacebook,
  socialInstagram,
  socialWhatsapp,
}: SiteSetupReviewStepProps) {
  const hasSocial =
    Boolean(socialFacebook) ||
    Boolean(socialInstagram) ||
    Boolean(socialWhatsapp);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-[var(--color-foreground)]">
            {labels.summaryInstitute}
          </dt>
          <dd className="text-[var(--color-muted-foreground)]">{appName}</dd>
          <dd className="text-[var(--color-muted-foreground)]">{legalName}</dd>
          <dd className="text-[var(--color-muted-foreground)]">{tagline}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-foreground)]">
            {labels.summaryContact}
          </dt>
          <dd className="text-[var(--color-muted-foreground)]">{contactEmail}</dd>
          <dd className="text-[var(--color-muted-foreground)]">{contactPhone}</dd>
          <dd className="whitespace-pre-wrap text-[var(--color-muted-foreground)]">
            {contactAddress}
          </dd>
        </div>
        {hasSocial ? (
          <div>
            <dt className="font-medium text-[var(--color-foreground)]">
              {labels.summarySocial}
            </dt>
            {socialFacebook ? (
              <dd className="truncate text-[var(--color-muted-foreground)]">
                {socialFacebook}
              </dd>
            ) : null}
            {socialInstagram ? (
              <dd className="truncate text-[var(--color-muted-foreground)]">
                {socialInstagram}
              </dd>
            ) : null}
            {socialWhatsapp ? (
              <dd className="truncate text-[var(--color-muted-foreground)]">
                {socialWhatsapp}
              </dd>
            ) : null}
          </div>
        ) : null}
      </dl>
    </div>
  );
}
