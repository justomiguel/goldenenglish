"use client";

import { PortalCalendarNarrowAgendaRow } from "@/components/pwa/molecules/PortalCalendarNarrowAgendaRow";
import type { PortalCalendarFcEventContentDict } from "@/components/organisms/PortalCalendarFcEventContent";
import type { PortalCalendarAgendaDayGroup } from "@/lib/calendar/groupPortalCalendarAgendaWeek";
import type { PortalCalendarEventVisualContext } from "@/lib/calendar/portalCalendarEventVisual";
import type { PortalCalendarEvent } from "@/types/portalCalendar";

export interface PortalCalendarNarrowAgendaListProps {
  groups: PortalCalendarAgendaDayGroup[];
  locale: string;
  now: Date;
  visualCtx: PortalCalendarEventVisualContext;
  contentDict: PortalCalendarFcEventContentDict;
  todayLabel: string;
  emptyLabel: string;
  hasWeekEvents: boolean;
  onSelect: (ev: PortalCalendarEvent) => void;
}

export function PortalCalendarNarrowAgendaList({
  groups,
  locale,
  now,
  visualCtx,
  contentDict,
  todayLabel,
  emptyLabel,
  hasWeekEvents,
  onSelect,
}: PortalCalendarNarrowAgendaListProps) {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ maxHeight: "min(70dvh, calc(100dvh - 18rem))" }}
    >
      {!hasWeekEvents ? (
        <p className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {groups.map((group) =>
            group.events.length === 0 ? null : (
              <section key={group.dayIso} aria-label={group.heading}>
                <div className="sticky top-0 z-[1] border-b border-[var(--color-border)] bg-[var(--color-muted)]/90 px-3 py-2 backdrop-blur-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    {group.heading}
                    {group.isToday ? (
                      <span className="ml-2 rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[0.65rem] font-bold text-[var(--color-secondary-foreground)]">
                        {todayLabel}
                      </span>
                    ) : null}
                  </h3>
                </div>
                <ul>
                  {group.events.map((ev) => (
                    <PortalCalendarNarrowAgendaRow
                      key={`${group.dayIso}-${ev.id}`}
                      ev={ev}
                      locale={locale}
                      now={now}
                      visualCtx={visualCtx}
                      dict={contentDict}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
