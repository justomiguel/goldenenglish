"use client";

import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

export interface EventRegisterMinorTicketsLabels {
  label: string;
  hint: string;
  adultLine: string;
  childLine: string;
  invalid: string;
}

interface EventRegisterMinorTicketsFieldProps {
  seats: number;
  count: number;
  disabled?: boolean;
  labels: EventRegisterMinorTicketsLabels;
  onChange: (count: number) => void;
}

export function EventRegisterMinorTicketsField({
  seats,
  count,
  disabled,
  labels,
  onChange,
}: EventRegisterMinorTicketsFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="event-register-minor-tickets">{labels.label}</Label>
      <Input
        id="event-register-minor-tickets"
        type="number"
        min={0}
        max={seats}
        value={String(count)}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.min(seats, Math.max(0, parsed)));
        }}
        className="mt-1 max-w-[8rem]"
      />
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.hint}</p>
    </div>
  );
}
