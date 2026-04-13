"use client";

import { useMemo, useState } from "react";

export interface AcademicSearchableSelectOption {
  id: string;
  label: string;
}

export interface AcademicSearchableSelectProps {
  id: string;
  label: string;
  filterPlaceholder: string;
  options: AcademicSearchableSelectOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function AcademicSearchableSelect({
  id,
  label,
  filterPlaceholder,
  options,
  value,
  onChange,
  disabled,
}: AcademicSearchableSelectProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = !t ? options : options.filter((o) => o.label.toLowerCase().includes(t));
    const sel = options.find((o) => o.id === value);
    if (sel && !base.some((o) => o.id === value)) return [sel, ...base];
    return base;
  }, [options, q, value]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor={`${id}-q`}>
        {label}
      </label>
      <input
        id={`${id}-q`}
        type="search"
        className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        placeholder={filterPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
      <select
        id={id}
        className="w-full max-h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {filtered.length === 0 ? (
          <option value="">{filterPlaceholder}</option>
        ) : (
          filtered.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
