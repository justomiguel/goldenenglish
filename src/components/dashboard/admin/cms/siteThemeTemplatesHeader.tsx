"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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
    <AdminPageHeader
      title={labels.title}
      lead={labels.lead}
      iconId="cms"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => onToggleShowArchived(e.target.checked)}
            />
            {labels.filterShowArchived}
          </label>
          <Button variant="primary" size="sm" onClick={onCreateClick} disabled={pending}>
            <Plus aria-hidden className="mr-1.5 h-4 w-4" />
            {labels.createCta}
          </Button>
        </div>
      }
    />
  );
}
