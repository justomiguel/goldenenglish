"use client";

import type { FormEvent } from "react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

type RegLabels = Dictionary["admin"]["registrations"];

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export interface RegistrationListToolbarProps {
  labels: RegLabels;
  query: string;
  onQueryChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function RegistrationListToolbar({
  labels,
  query,
  onQueryChange,
  totalCount,
  filteredCount,
}: RegistrationListToolbarProps) {
  function onSubmitFilter(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      <form onSubmit={onSubmitFilter} className="space-y-1">
        <Label htmlFor="registrations-filter">{labels.filterLabel}</Label>
        <Input
          id="registrations-filter"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={labels.filterPlaceholder}
          title={labels.filterTooltip}
          className="w-full max-w-xl"
          autoComplete="off"
        />
      </form>
      <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted-foreground)]">
        <span>{tpl(labels.countTotal, totalCount)}</span>
        <span>{tpl(labels.countAfterFilter, filteredCount)}</span>
      </div>
    </>
  );
}
