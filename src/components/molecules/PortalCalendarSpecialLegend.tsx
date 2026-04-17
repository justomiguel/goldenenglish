"use client";

import type { Dictionary } from "@/types/i18n";
import { PORTAL_SPECIAL_EVENT_TYPES } from "@/types/portalSpecialCalendar";
import { specialTypeSwatchClass } from "@/components/molecules/portalCalendarAgendaSpecialChips";

export interface PortalCalendarSpecialLegendProps {
  title: string;
  types: Dictionary["dashboard"]["portalCalendar"]["specialTypes"];
}

export function PortalCalendarSpecialLegend({ title, types }: PortalCalendarSpecialLegendProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{title}</p>
      <div className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]">
        {PORTAL_SPECIAL_EVENT_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-2">
            <span className={`inline-block h-2 w-6 shrink-0 rounded-sm ${specialTypeSwatchClass(t)}`} aria-hidden />
            <span>{types[t].chip}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
