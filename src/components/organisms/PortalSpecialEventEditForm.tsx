"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { PortalSpecialCalendarScope, PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { updatePortalSpecialCalendarEventAction } from "@/app/[locale]/dashboard/admin/calendar/specialEventsActions";
import { PortalSpecialEventScopeFields } from "@/components/molecules/PortalSpecialEventScopeFields";
import type { AdminSpecialCohortOption, AdminSpecialSectionOption } from "@/lib/calendar/loadAdminSpecialEventScopeOptions";

type SpecialAdminDict = Dictionary["dashboard"]["portalCalendar"]["specialAdmin"];
type SpecialEditDict = Dictionary["dashboard"]["portalCalendar"]["specialEdit"];

export interface PortalSpecialEventEditFormProps {
  locale: string;
  eventId: string;
  dict: SpecialAdminDict;
  editDict: SpecialEditDict;
  scopeOptions: { cohorts: AdminSpecialCohortOption[]; sections: AdminSpecialSectionOption[] };
  initial: {
    title: string;
    notes: string;
    eventDate: string;
    allDay: boolean;
    startTime: string;
    endTime: string;
    eventType: PortalSpecialEventTypeSlug;
    calendarScope: PortalSpecialCalendarScope;
    cohortId: string;
    sectionId: string;
    meetingUrl: string;
  };
}

export function PortalSpecialEventEditForm({
  locale,
  eventId,
  dict,
  editDict,
  scopeOptions,
  initial,
}: PortalSpecialEventEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes);
  const [eventDate, setEventDate] = useState(initial.eventDate);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [eventType, setEventType] = useState<PortalSpecialEventTypeSlug>(initial.eventType);
  const [calendarScope, setCalendarScope] = useState<PortalSpecialCalendarScope>(initial.calendarScope);
  const [cohortId, setCohortId] = useState(initial.cohortId);
  const [sectionId, setSectionId] = useState(initial.sectionId);
  const [meetingUrl, setMeetingUrl] = useState(initial.meetingUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const scopeOk =
    calendarScope === "global" ||
    (calendarScope === "cohort" && cohortId.length > 0) ||
    (calendarScope === "section" && sectionId.length > 0);

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await updatePortalSpecialCalendarEventAction({
        locale,
        id: eventId,
        title,
        notes: notes.trim() || undefined,
        eventDate,
        allDay,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
        eventType,
        calendarScope,
        cohortId: calendarScope === "cohort" ? cohortId : "",
        sectionId: calendarScope === "section" ? sectionId : "",
        meetingUrl: meetingUrl.trim() || undefined,
      });
      if (!r.ok) {
        setMsg(r.code === "PARSE" ? dict.errorParse : dict.errorSave);
        return;
      }
      router.push(`/${locale}/dashboard/admin/calendar/special`);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <PortalSpecialEventScopeFields
          dict={dict}
          eventType={eventType}
          onEventType={setEventType}
          calendarScope={calendarScope}
          onCalendarScope={setCalendarScope}
          cohortId={cohortId}
          onCohortId={setCohortId}
          sectionId={sectionId}
          onSectionId={setSectionId}
          meetingUrl={meetingUrl}
          onMeetingUrl={setMeetingUrl}
          cohorts={scopeOptions.cohorts}
          sections={scopeOptions.sections}
          disabled={pending}
        />
        <div className="sm:col-span-2">
          <Label htmlFor="ed-title">{dict.titleLabel}</Label>
          <Input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ed-notes">{dict.notesLabel}</Label>
          <Input id="ed-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={pending} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="ed-date">{dict.dateLabel}</Label>
          <Input id="ed-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} disabled={pending} className="mt-1" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={pending} />
            {dict.allDayLabel}
          </label>
        </div>
        {!allDay ? (
          <>
            <div>
              <Label htmlFor="ed-st">{dict.startTimeLabel}</Label>
              <Input id="ed-st" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={pending} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="ed-en">{dict.endTimeLabel}</Label>
              <Input id="ed-en" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={pending} className="mt-1" />
            </div>
          </>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={save} isLoading={pending} disabled={pending || !title.trim() || !eventDate || !scopeOk}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {editDict.save}
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => router.push(`/${locale}/dashboard/admin/calendar/special`)}>
          {!pending ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {editDict.cancel}
        </Button>
      </div>
      {msg ? (
        <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
