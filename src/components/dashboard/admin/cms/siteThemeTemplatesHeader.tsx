"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";

interface HeaderLabels {
  title: string;
  lead: string;
  filterShowArchived: string;
  createCta: string;
}

export interface SiteThemeTemplatesHeaderProps {
  labels: HeaderLabels;
  showArchived: boolean;
  onToggleShowArchived: (value: boolean) => void;
  onCreateClick: () => void;
  pending: boolean;
}

export function SiteThemeTemplatesHeader({
  labels,
  showArchived,
  onToggleShowArchived,
  onCreateClick,
  pending,
}: SiteThemeTemplatesHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {labels.title}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          {labels.lead}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleShowArchived(e.target.checked)}
          />
          {labels.filterShowArchived}
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateClick}
          disabled={pending}
        >
          <Plus aria-hidden className="mr-1.5 h-4 w-4" />
          {labels.createCta}
        </Button>
      </div>
    </header>
  );
}
