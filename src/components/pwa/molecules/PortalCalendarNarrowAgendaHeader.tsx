"use client";

import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type ScheduleDict = Dictionary["dashboard"]["portalCalendar"]["schedule"];

export type PortalCalendarNarrowAgendaView = "list" | "month";

export interface PortalCalendarNarrowAgendaHeaderProps {
  weekTitle: string;
  dict: ScheduleDict;
  view: PortalCalendarNarrowAgendaView;
  onViewChange: (view: PortalCalendarNarrowAgendaView) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function PortalCalendarNarrowAgendaHeader({
  weekTitle,
  dict,
  view,
  onViewChange,
  onPrevWeek,
  onNextWeek,
  onToday,
}: PortalCalendarNarrowAgendaHeaderProps) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0 px-2"
            onClick={onPrevWeek}
            aria-label={dict.agendaPrevWeek}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <p className="min-w-0 flex-1 truncate text-center font-display text-sm font-semibold text-[var(--color-foreground)]">
            {weekTitle}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0 px-2"
            onClick={onNextWeek}
            aria-label={dict.agendaNextWeek}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={onToday}>
          {dict.today}
        </Button>
      </div>
      <div className="flex rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-0.5">
        <Button
          type="button"
          variant={view === "list" ? "primary" : "ghost"}
          size="sm"
          className="min-h-[40px] flex-1 gap-1.5"
          onClick={() => onViewChange("list")}
        >
          <List className="h-4 w-4" aria-hidden />
          {dict.viewsList}
        </Button>
        <Button
          type="button"
          variant={view === "month" ? "primary" : "ghost"}
          size="sm"
          className="min-h-[40px] flex-1 gap-1.5"
          onClick={() => onViewChange("month")}
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          {dict.viewsMonth}
        </Button>
      </div>
    </div>
  );
}
