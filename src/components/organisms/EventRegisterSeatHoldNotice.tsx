"use client";

import { Armchair } from "lucide-react";
import { Button } from "@/components/atoms/Button";

interface EventRegisterSeatHoldNoticeProps {
  placement: "inline" | "sticky";
  notice: string | null;
  countdown: string | null;
  chooseAnotherLabel: string;
  useSuggestedLabel: string | null;
  onChooseAnother: () => void;
  onUseSuggestions: () => void;
}

export function EventRegisterSeatHoldNotice({
  placement,
  notice,
  countdown,
  chooseAnotherLabel,
  useSuggestedLabel,
  onChooseAnother,
  onUseSuggestions,
}: EventRegisterSeatHoldNoticeProps) {
  if (!notice && !countdown) return null;
  const sticky = placement === "sticky";
  return (
    <div
      data-seat-hold-notice="true"
      role={notice ? "alert" : "status"}
      className={
        sticky
          ? "fixed inset-x-3 z-20 flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-sm"
          : "space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3"
      }
      style={sticky ? { bottom: "max(0.75rem, env(safe-area-inset-bottom))" } : undefined}
    >
      {notice ? <p className="text-sm text-[var(--color-foreground)]">{notice}</p> : null}
      {countdown ? <p className="text-sm text-[var(--color-muted-foreground)]">{countdown}</p> : null}
      {notice ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" className="min-h-[44px]" onClick={onChooseAnother}>
            <Armchair className="h-4 w-4" aria-hidden />
            {chooseAnotherLabel}
          </Button>
          {useSuggestedLabel ? (
            <Button type="button" variant="ghost" className="min-h-[44px]" onClick={onUseSuggestions}>
              <Armchair className="h-4 w-4" aria-hidden />
              {useSuggestedLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
