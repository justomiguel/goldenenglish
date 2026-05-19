"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import { useAppSurface } from "@/hooks/useAppSurface";
import { PortalCalendarNarrowAgenda } from "@/components/pwa/organisms/PortalCalendarNarrowAgenda";
import { PortalCalendarAssistPanel } from "@/components/organisms/PortalCalendarAssistPanel";
import { ParentAttendancePwaSectionCard } from "@/components/pwa/molecules/ParentAttendancePwaSectionCard";
import { PortalComposeExpandableFab } from "@/components/pwa/molecules/PortalComposeExpandableFab";
import type { PortalCalendarScheduleBoardDict } from "@/components/organisms/PortalCalendarScheduleBoard";

type ParentAttendanceLabels = Dictionary["dashboard"]["parent"]["attendancePwa"];
type PortalCalDict = Dictionary["dashboard"]["portalCalendar"];

export interface ParentAttendancePwaScreenProps {
  locale: string;
  model: ParentRecentAttendanceModel;
  labels: ParentAttendanceLabels;
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  wardPickerLabel: string;
  wardPickerHint: string;
  portalCalendarDict: PortalCalDict;
  scheduleDict: PortalCalendarScheduleBoardDict;
  events: PortalCalendarEvent[];
  feedUrl: string | null;
  viewerId?: string;
}

export function ParentAttendancePwaScreen({
  locale,
  model,
  labels,
  wardOptions,
  selectedStudentId,
  wardPickerLabel,
  wardPickerHint,
  portalCalendarDict,
  scheduleDict,
  events,
  feedUrl,
  viewerId,
}: ParentAttendancePwaScreenProps) {
  const scheduleTitleId = useId();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const surface = useAppSurface();
  const isNarrowParent = surface === "web-mobile" || surface === "pwa-mobile";
  const basePath = `/${locale}/dashboard/parent/calendar`;
  const filteredSummaries = useMemo(
    () =>
      model.sectionSummaries.filter(
        (s) => !selectedStudentId || s.studentId === selectedStudentId,
      ),
    [model.sectionSummaries, selectedStudentId],
  );

  const marksBySection = useMemo(() => {
    const map = new Map<string, typeof model.marks>();
    for (const mark of model.marks) {
      if (selectedStudentId && mark.studentId !== selectedStudentId) continue;
      const key = `${mark.studentId}:${mark.sectionId}`;
      const list = map.get(key) ?? [];
      list.push(mark);
      map.set(key, list);
    }
    for (const [key, list] of map) {
      list.sort((a, b) => b.attendedOn.localeCompare(a.attendedOn));
      map.set(key, list);
    }
    return map;
  }, [model.marks, selectedStudentId]);

  return (
    <div className={isNarrowParent ? "space-y-5 pb-20" : "space-y-5"}>
      <header className="space-y-3">
        <div className={isNarrowParent ? "min-w-0" : "flex flex-wrap items-start justify-between gap-3"}>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--color-foreground)]">
              {labels.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
          </div>
          {!isNarrowParent ? (
            <Button type="button" variant="secondary" onClick={() => setScheduleOpen(true)}>
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              {labels.openSchedule}
            </Button>
          ) : null}
        </div>

        <ParentWardPicker
          options={wardOptions}
          selectedStudentId={selectedStudentId}
          label={wardPickerLabel}
          hint={wardPickerHint}
          basePath={basePath}
          variant={isNarrowParent ? "pwa" : "default"}
          selectId="parent-attendance-ward-picker"
        />
      </header>

      {filteredSummaries.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {labels.empty}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((summary) => {
            const sectionKey = `${summary.studentId}:${summary.sectionId}`;
            return (
              <ParentAttendancePwaSectionCard
                key={sectionKey}
                summary={summary}
                marks={marksBySection.get(sectionKey) ?? []}
                locale={locale}
                labels={labels}
                showChildLabel={false}
              />
            );
          })}
        </div>
      )}

      {isNarrowParent ? (
        <PortalComposeExpandableFab
          label={labels.openSchedule}
          Icon={CalendarDays}
          onClick={() => setScheduleOpen(true)}
        />
      ) : null}

      <Modal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        titleId={scheduleTitleId}
        title={labels.scheduleModalTitle}
        dialogClassName="sm:max-w-lg md:max-w-2xl lg:max-w-3xl"
        ariaLabel={labels.openScheduleAria}
      >
        <div className="space-y-4 px-4 pb-4 pt-2">
          <PortalCalendarAssistPanel dict={portalCalendarDict} feedUrl={feedUrl} />
          <PortalCalendarNarrowAgenda
            locale={locale}
            events={events}
            dict={scheduleDict}
            viewerId={viewerId}
          />
        </div>
      </Modal>
    </div>
  );
}
