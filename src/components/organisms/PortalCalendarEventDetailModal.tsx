"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { PortalCalendarFcExtendedProps } from "@/lib/calendar/portalEventsToFullCalendar";
import { portalCalendarKindLabel } from "@/lib/calendar/portalCalendarKindLabel";
import { safeCalendarMeetingHref } from "@/lib/calendar/safeCalendarMeetingHref";

export type PortalCalendarEventDetailModalDict = Dictionary["dashboard"]["portalCalendar"]["schedule"] & {
  legend: Dictionary["dashboard"]["portalCalendar"]["legend"];
  specialTypes: Dictionary["dashboard"]["portalCalendar"]["specialTypes"];
};

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function formatWhen(start: Date | null, end: Date | null, allDay: boolean, locale: string): string {
  if (!start) return "";
  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (allDay) {
    if (end && !sameLocalCalendarDay(start, end)) return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
    return dateFmt.format(start);
  }
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const startT = timeFmt.format(start);
  if (!end || end.getTime() === start.getTime()) return `${dateFmt.format(start)} · ${startT}`;
  return `${dateFmt.format(start)} · ${startT}–${timeFmt.format(end)}`;
}

export interface PortalCalendarEventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  extendedProps: PortalCalendarFcExtendedProps;
  locale: string;
  dict: PortalCalendarEventDetailModalDict;
}

export function PortalCalendarEventDetailModal({
  open,
  onOpenChange,
  titleId,
  title,
  start,
  end,
  allDay,
  extendedProps,
  locale,
  dict,
}: PortalCalendarEventDetailModalProps) {
  const kindLabel = useMemo(
    () =>
      portalCalendarKindLabel(extendedProps.kind, extendedProps.specialEventType, dict.legend, dict.specialTypes),
    [dict.legend, dict.specialTypes, extendedProps.kind, extendedProps.specialEventType],
  );

  const whenLine = useMemo(() => formatWhen(start, end, allDay, locale), [allDay, end, locale, start]);

  const meetingHref = safeCalendarMeetingHref(extendedProps.meetingUrl);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      title={title.trim() ? title : dict.detailTitleFallback}
      dialogClassName="max-w-lg"
    >
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.detailKind}
          </dt>
          <dd className="mt-0.5 text-[var(--color-foreground)]">{kindLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.detailWhen}
          </dt>
          <dd className="mt-0.5 text-[var(--color-foreground)]">{whenLine}</dd>
        </div>
        {extendedProps.roomLabel ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {dict.detailRoom}
            </dt>
            <dd className="mt-0.5 text-[var(--color-foreground)]">{extendedProps.roomLabel}</dd>
          </div>
        ) : null}
        {meetingHref ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {dict.detailMeeting}
            </dt>
            <dd className="mt-0.5">
              <a
                href={meetingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-primary)] underline underline-offset-2"
              >
                {meetingHref}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="pt-2">
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {dict.detailClose}
        </Button>
      </div>
    </Modal>
  );
}
