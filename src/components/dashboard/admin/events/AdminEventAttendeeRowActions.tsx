"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminEventAttendeeDeleteButton } from "@/components/dashboard/admin/events/AdminEventAttendeeDeleteButton";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";

interface AdminEventAttendeeRowActionsProps {
  locale: string;
  eventId: string;
  attendeeId: string;
  expanded: boolean;
  deletable: boolean;
  labels: AdminEventAttendeesPanelLabels;
  onToggle: () => void;
}

export function AdminEventAttendeeRowActions({
  locale,
  eventId,
  attendeeId,
  expanded,
  deletable,
  labels,
  onToggle,
}: AdminEventAttendeeRowActionsProps) {
  const expandLabel = expanded ? labels.collapseRow : labels.expandRow;

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        aria-expanded={expanded}
        aria-label={expandLabel}
        title={expandLabel}
        className="min-h-9 shrink-0 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-primary-dark)] transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
        {labels.moreDetails}
      </Button>
      {deletable ? (
        <AdminEventAttendeeDeleteButton
          locale={locale}
          eventId={eventId}
          attendeeId={attendeeId}
          labels={labels.delete}
        />
      ) : null}
    </div>
  );
}
