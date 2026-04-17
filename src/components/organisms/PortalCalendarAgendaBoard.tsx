"use client";

import { useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import { chipClassForPortalCalendarEvent } from "@/components/molecules/portalCalendarAgendaSpecialChips";

type CalDict = {
  pickDay: string;
  emptyDay: string;
  agendaTitle: string;
  kindClass: string;
  kindExam: string;
  kindSpecial: string;
  allDay: string;
  specialTypes: Dictionary["dashboard"]["portalCalendar"]["specialTypes"];
};

export interface PortalCalendarAgendaBoardProps {
  locale: string;
  events: PortalCalendarEvent[];
  dict: CalDict;
  /** When true, skip month grid and show grouped agenda only. */
  narrowAgenda: boolean;
}

function dayKeyUtc(iso: string): string {
  return iso.slice(0, 10);
}

function kindLabel(ev: PortalCalendarEvent, dict: CalDict): string {
  if (ev.kind === "exam") return dict.kindExam;
  if (ev.kind === "special" && ev.specialEventType) return dict.specialTypes[ev.specialEventType].chip;
  if (ev.kind === "special") return dict.kindSpecial;
  return dict.kindClass;
}

function specialTooltip(ev: PortalCalendarEvent, dict: CalDict): string | undefined {
  if (ev.kind === "special" && ev.specialEventType) return dict.specialTypes[ev.specialEventType].legend;
  return undefined;
}

export function PortalCalendarAgendaBoard({ locale, events, dict, narrowAgenda }: PortalCalendarAgendaBoardProps) {
  const [picked, setPicked] = useState(() => {
    const t = new Date();
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 12, 0, 0));
  });

  const pickedKey = useMemo(() => picked.toISOString().slice(0, 10), [picked]);

  const byDay = useMemo(() => {
    const m = new Map<string, PortalCalendarEvent[]>();
    for (const ev of events) {
      const k = dayKeyUtc(ev.start);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(ev);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.start.localeCompare(b.start));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  const dayEvents = useMemo(
    () => events.filter((e) => dayKeyUtc(e.start) === pickedKey).sort((a, b) => a.start.localeCompare(b.start)),
    [events, pickedKey],
  );

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const longDayFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [locale],
  );

  const agendaRows = narrowAgenda ? byDay : [];

  return (
    <div className={narrowAgenda ? "space-y-4" : "grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]"}>
      {!narrowAgenda ? (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-primary)]">{dict.pickDay}</p>
          <Calendar
            value={picked}
            onChange={(v) => {
              if (v instanceof Date) setPicked(v);
            }}
            locale={locale}
          />
        </div>
      ) : (
        <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">{dict.agendaTitle}</h2>
      )}
      <div className="min-w-0 space-y-3">
        {narrowAgenda ? (
          agendaRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{dict.emptyDay}</p>
          ) : (
          <ul className="space-y-4">
            {agendaRows.map(([day, list]) => (
              <li key={day} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {longDayFmt.format(new Date(`${day}T12:00:00.000Z`))}
                </p>
                <ul className="mt-2 space-y-2">
                  {list.map((ev) => (
                    <li
                      key={ev.id}
                      className={`rounded-md border px-2 py-2 text-sm ${chipClassForPortalCalendarEvent(ev)}`}
                      title={specialTooltip(ev, dict)}
                    >
                      <span className="mr-2 font-mono text-xs opacity-80">
                        {ev.allDay ? dict.allDay : timeFmt.format(new Date(ev.start))}
                      </span>
                      {ev.title}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          )
        ) : (
          <>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {longDayFmt.format(picked)}
            </p>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">{dict.emptyDay}</p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className={`flex flex-wrap items-baseline gap-2 rounded-md border px-3 py-2 text-sm ${chipClassForPortalCalendarEvent(ev)}`}
                    title={specialTooltip(ev, dict)}
                  >
                    <span className="font-mono text-xs">{ev.allDay ? dict.allDay : timeFmt.format(new Date(ev.start))}</span>
                    <span className="font-medium">{ev.title}</span>
                    <span className="text-xs opacity-80">({kindLabel(ev, dict)})</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
