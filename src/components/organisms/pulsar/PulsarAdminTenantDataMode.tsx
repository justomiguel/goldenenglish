"use client";

import { Database, Server } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export type PulsarTenantDataMode = "project" | "shared_schema";

export interface PulsarAdminTenantDataModeProps {
  dict: Dictionary;
  value: PulsarTenantDataMode;
  disabled: boolean;
  onChange: (mode: PulsarTenantDataMode) => void;
}

export function PulsarAdminTenantDataMode({
  dict,
  value,
  disabled,
  onChange,
}: PulsarAdminTenantDataModeProps) {
  const formCopy = dict.pulsar.admin.form;
  const options: Array<{ id: PulsarTenantDataMode; label: string; icon: typeof Database }> = [
    { id: "project", label: formCopy.dataModeProject, icon: Server },
    { id: "shared_schema", label: formCopy.dataModeShared, icon: Database },
  ];

  return (
    <fieldset
      disabled={disabled}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 disabled:opacity-80"
    >
      <legend className="px-1 text-base font-bold text-[var(--color-foreground)]">
        {formCopy.dataModeLegend}
      </legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                  : "border-[var(--color-border)] text-[var(--color-foreground)]"
              }`}
            >
              <input
                type="radio"
                name="dataMode"
                className="h-4 w-4"
                checked={selected}
                onChange={() => onChange(option.id)}
              />
              <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {value === "shared_schema" ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {formCopy.dataModeSharedLead}
        </p>
      ) : null}
    </fieldset>
  );
}
