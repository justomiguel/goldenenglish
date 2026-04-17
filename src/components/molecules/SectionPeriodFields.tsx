"use client";

import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

export interface SectionPeriodFieldsDict {
  startsLabel: string;
  endsLabel: string;
}

export interface SectionPeriodFieldsProps {
  idPrefix: string;
  startsOn: string;
  endsOn: string;
  onChange: (next: { startsOn: string; endsOn: string }) => void;
  dict: SectionPeriodFieldsDict;
  disabled?: boolean;
}

export function SectionPeriodFields({
  idPrefix,
  startsOn,
  endsOn,
  onChange,
  dict,
  disabled,
}: SectionPeriodFieldsProps) {
  return (
    <div className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idPrefix}-starts`}>{dict.startsLabel}</Label>
          <Input
            id={`${idPrefix}-starts`}
            type="date"
            className="mt-1 w-full"
            value={startsOn}
            disabled={disabled}
            onChange={(e) => onChange({ startsOn: e.target.value, endsOn })}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-ends`}>{dict.endsLabel}</Label>
          <Input
            id={`${idPrefix}-ends`}
            type="date"
            className="mt-1 w-full"
            value={endsOn}
            disabled={disabled}
            onChange={(e) => onChange({ startsOn, endsOn: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
