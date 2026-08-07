"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { ProgressSectionDropdown } from "@/components/desktop/molecules/ProgressSectionDropdown";
import { ProgressSectionSheet } from "@/components/pwa/molecules/ProgressSectionSheet";
import type { ProgressPickerCopy } from "@/lib/parent/formatProgressSectionLabels";
import type { ProgressPickerOption } from "@/components/parent/progressPickerOption";

export interface ProgressSectionPickerProps {
  options: ProgressPickerOption[];
  value: string;
  onChange: (id: string) => void;
  copy: ProgressPickerCopy;
}

function PickerSkeleton() {
  return (
    <div
      className="h-[52px] w-full animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] sm:w-72"
      aria-hidden
    />
  );
}

/** Tier A switch between the anchored dropdown and the bottom sheet. */
export function ProgressSectionPicker({ options, value, onChange, copy }: ProgressSectionPickerProps) {
  return (
    <SurfaceMountGate
      skeleton={<PickerSkeleton />}
      desktop={
        <ProgressSectionDropdown options={options} value={value} onChange={onChange} copy={copy} />
      }
      narrow={() => (
        <ProgressSectionSheet options={options} value={value} onChange={onChange} copy={copy} />
      )}
    />
  );
}
