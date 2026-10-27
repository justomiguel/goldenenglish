"use client";

import { useState } from "react";
import { TicketPercent } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";

export interface EventRegisterDiscountCodeLabels {
  label: string;
  placeholder: string;
  apply: string;
  clear: string;
  pay: string;
  invalid: string;
  noUses: string;
  conflict: string;
}

interface EventRegisterDiscountCodeProps {
  slug: string;
  locale: string;
  currency: string;
  freeLabel: string;
  flowId: string | null;
  isLocalResident: boolean;
  disabled?: boolean;
  applied: EventDiscountApplied | null;
  payAmount?: number | null;
  onApplied: (next: EventDiscountApplied) => void;
  onClear: () => void;
  labels: EventRegisterDiscountCodeLabels;
}

export function EventRegisterDiscountCode({
  slug,
  locale,
  currency,
  freeLabel,
  flowId,
  isLocalResident,
  disabled = false,
  applied,
  payAmount = null,
  onApplied,
  onClear,
  labels,
}: EventRegisterDiscountCodeProps) {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function applyCode() {
    const code = draft.trim();
    if (!code) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/events/${slug}/discount-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, flowId: flowId ?? undefined, isLocalResident, locale }),
      });
      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            code?: string;
            kind?: string;
            percent?: number;
            discountAmount?: number;
            ticketCount?: number;
          }
        | null;
      if (!response.ok || !body?.ok) {
        setMessage(body?.code === "no_uses" ? labels.noUses : labels.invalid);
        return;
      }
      if (body.kind === "amount" && body.discountAmount != null && body.ticketCount != null) {
        onApplied({
          code,
          kind: "amount",
          discountAmount: body.discountAmount,
          ticketCount: body.ticketCount,
        });
        setDraft("");
        return;
      }
      if (body.kind === "percent" && body.percent != null) {
        onApplied({ code, kind: "percent", percent: body.percent });
        setDraft("");
        return;
      }
      setMessage(labels.invalid);
    } catch {
      setMessage(labels.invalid);
    } finally {
      setPending(false);
    }
  }

  const price =
    applied?.kind === "percent" && payAmount != null
      ? formatEventFlowPriceLabel({
          price: payAmount,
          currency,
          locale,
          freeLabel,
        })
      : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm text-[var(--color-foreground)]" htmlFor="event-discount-code">
        {labels.label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="event-discount-code"
          value={applied?.code ?? draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={labels.placeholder}
          disabled={disabled || pending || applied != null}
          className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
        />
        {applied ? (
          <Button type="button" variant="ghost" onClick={onClear} disabled={disabled}>
            {labels.clear}
          </Button>
        ) : (
          <Button type="button" onClick={() => void applyCode()} disabled={disabled || pending}>
            <TicketPercent className="h-4 w-4" aria-hidden />
            {labels.apply}
          </Button>
        )}
      </div>
      {price ? (
        <p className="text-sm text-[var(--color-foreground)]">
          {labels.pay} {price}
        </p>
      ) : null}
      {message ? <p className="text-sm text-[var(--color-error)]">{message}</p> : null}
    </div>
  );
}
