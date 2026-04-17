"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { PortalSpecialCalendarScope, PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { createPortalSpecialCalendarEventAction } from "@/app/[locale]/dashboard/admin/calendar/specialEventsActions";
import { PortalSpecialEventScopeFields } from "@/components/molecules/PortalSpecialEventScopeFields";
import type { AdminSpecialCohortOption, AdminSpecialSectionOption } from "@/lib/calendar/loadAdminSpecialEventScopeOptions";

type SpecialAdminDict = Dictionary["dashboard"]["portalCalendar"]["specialAdmin"];

export interface PortalSpecialEventCreateFormProps {
  locale: string;
  dict: SpecialAdminDict;
  scopeOptions: { cohorts: AdminSpecialCohortOption[]; sections: AdminSpecialSectionOption[] };
}

export function PortalSpecialEventCreateForm({ locale, dict, scopeOptions }: PortalSpecialEventCreateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [eventType, setEventType] = useState<PortalSpecialEventTypeSlug>("social");
  const [calendarScope, setCalendarScope] = useState<PortalSpecialCalendarScope>("global");
  const [cohortId, setCohortId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const scopeOk =
    calendarScope === "global" ||
    (calendarScope === "cohort" && cohortId.length > 0) ||
    (calendarScope === "section" && sectionId.length > 0);

  const submit = () => {
    setMsg(null);
    start(async () => {
      const r = await createPortalSpecialCalendarEventAction({
        locale,
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
      setTitle("");
      setNotes("");
      setMeetingUrl("");
      setCohortId("");
      setSectionId("");
      setCalendarScope("global");
      setEventType("social");
      router.refresh();
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.createTitle}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          <Label htmlFor="spe-title">{dict.titleLabel}</Label>
          <Input id="spe-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="spe-notes">{dict.notesLabel}</Label>
          <Input id="spe-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={pending} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="spe-date">{dict.dateLabel}</Label>
          <Input
            id="spe-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={pending}
            className="mt-1"
          />
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
              <Label htmlFor="spe-st">{dict.startTimeLabel}</Label>
              <Input
                id="spe-st"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={pending}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="spe-en">{dict.endTimeLabel}</Label>
              <Input id="spe-en" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={pending} className="mt-1" />
            </div>
          </>
        ) : null}
      </div>
      <Button
        type="button"
        className="mt-4"
        onClick={submit}
        isLoading={pending}
        disabled={pending || !title.trim() || !eventDate || !scopeOk}
      >
        {dict.saveCreate}
      </Button>
      {msg ? (
        <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
