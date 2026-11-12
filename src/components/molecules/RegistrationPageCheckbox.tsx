"use client";

import { useEffect, useRef } from "react";
import type { RegistrationPageSelection } from "@/hooks/useRegistrationPageSelection";

export function RegistrationPageCheckbox({
  checked,
  mixed = false,
  label,
  onToggle,
}: {
  checked: boolean;
  mixed?: boolean;
  label: string;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        aria-checked={mixed ? "mixed" : checked}
        aria-label={label}
        onChange={onToggle}
        className="h-4 w-4 accent-[var(--color-primary)]"
      />
    </label>
  );
}

export function RegistrationSelectionHeader({
  selection,
  label,
}: {
  selection?: RegistrationPageSelection;
  label: string;
}) {
  if (!selection) {
    return <th scope="col" className="w-10 px-2 py-2" aria-hidden />;
  }
  return (
    <th scope="col" className="w-10 px-2 py-2">
      <RegistrationPageCheckbox
        checked={selection.allMarked}
        mixed={selection.someMarked}
        label={label}
        onToggle={selection.togglePage}
      />
    </th>
  );
}
