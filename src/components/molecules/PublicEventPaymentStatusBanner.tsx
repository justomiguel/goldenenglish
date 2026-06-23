"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { EventPaymentReturnStatus } from "@/lib/events/buildEventPaymentReturnUrl";

export interface PublicEventPaymentStatusLabels {
  successTitle: string;
  successBody: string;
  pendingTitle: string;
  pendingBody: string;
  processingTitle: string;
  processingBody: string;
  failureTitle: string;
  failureBody: string;
  dismiss: string;
}

interface PublicEventPaymentStatusBannerProps {
  status: EventPaymentReturnStatus;
  labels: PublicEventPaymentStatusLabels;
}

type Tone = "positive" | "neutral" | "error";

const STATUS_TONE: Record<EventPaymentReturnStatus, Tone> = {
  success: "positive",
  pending: "neutral",
  processing: "neutral",
  failure: "error",
};

const TONE_ACCENT: Record<Tone, string> = {
  positive: "var(--color-success)",
  neutral: "var(--color-primary)",
  error: "var(--color-error)",
};

export function PublicEventPaymentStatusBanner({
  status,
  labels,
}: PublicEventPaymentStatusBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tone = STATUS_TONE[status];
  const accent = TONE_ACCENT[tone];
  const Icon =
    tone === "positive" ? CheckCircle2 : tone === "error" ? AlertCircle : Clock;

  const title =
    status === "success"
      ? labels.successTitle
      : status === "pending"
        ? labels.pendingTitle
        : status === "processing"
          ? labels.processingTitle
          : labels.failureTitle;
  const body =
    status === "success"
      ? labels.successBody
      : status === "pending"
        ? labels.pendingBody
        : status === "processing"
          ? labels.processingBody
          : labels.failureBody;

  function handleDismiss() {
    setDismissed(true);
    router.replace(pathname);
  }

  return (
    <section
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border-l-4 bg-[var(--color-surface)] p-4 shadow-sm"
      style={{ borderLeftColor: accent }}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold" style={{ color: accent }}>
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">{body}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={labels.dismiss}
        title={labels.dismiss}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
