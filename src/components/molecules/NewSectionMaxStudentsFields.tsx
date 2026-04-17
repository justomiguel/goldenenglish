"use client";

import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

export interface NewSectionMaxStudentsFieldsDict {
  maxStudentsLabel: string;
  maxStudentsDefaultHint: string;
  maxStudentsCustomize: string;
  maxStudentsCustomLabel: string;
  maxStudentsCustomHint: string;
}

export interface NewSectionMaxStudentsFieldsProps {
  defaultMaxStudents: number;
  customizeMax: boolean;
  onCustomizeMaxChange: (v: boolean) => void;
  maxRaw: string;
  onMaxRawChange: (v: string) => void;
  dict: NewSectionMaxStudentsFieldsDict;
  disabled?: boolean;
}

export function NewSectionMaxStudentsFields({
  defaultMaxStudents,
  customizeMax,
  onCustomizeMaxChange,
  maxRaw,
  onMaxRawChange,
  dict,
  disabled,
}: NewSectionMaxStudentsFieldsProps) {
  return (
    <div>
      <Label htmlFor="ns-max-default">{dict.maxStudentsLabel}</Label>
      <Input
        id="ns-max-default"
        type="number"
        min={1}
        className="mt-1 w-full bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)]"
        value={String(defaultMaxStudents)}
        disabled
        aria-disabled="true"
      />
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.maxStudentsDefaultHint}</p>

      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-[var(--color-foreground)]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
          checked={customizeMax}
          onChange={(e) => onCustomizeMaxChange(e.target.checked)}
          disabled={disabled}
        />
        <span>{dict.maxStudentsCustomize}</span>
      </label>

      {customizeMax ? (
        <div className="mt-3">
          <Label htmlFor="ns-max-custom">{dict.maxStudentsCustomLabel}</Label>
          <Input
            id="ns-max-custom"
            type="number"
            min={1}
            className="mt-1 w-full"
            value={maxRaw}
            onChange={(e) => onMaxRawChange(e.target.value)}
            disabled={disabled}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.maxStudentsCustomHint}</p>
        </div>
      ) : null}
    </div>
  );
}
