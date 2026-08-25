"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import { Button } from "@/components/atoms/Button";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
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
  /** When set, only this academic section is shown. */
  selectedSectionId?: string | null;
  /** When true, ward picker is omitted (shell owns focus). */
  shellOwnsFocus?: boolean;
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
  selectedSectionId = null,
  shellOwnsFocus = false,
}: ParentAttendancePwaScreenProps) {
  const scheduleTitleId = useId();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const surface = useAppSurface();
  const isNarrowParent = surface === "web-mobile" || surface === "pwa-mobile";
  const basePath = `/${locale}/dashboard/parent/calendar`;
  const filteredSummaries = useMemo(
    () =>
      model.sectionSummaries.filter((s) => {
        if (selectedStudentId && s.studentId !== selectedStudentId) return false;
        if (selectedSectionId && s.sectionId !== selectedSectionId) return false;
        return true;
      }),
    [model.sectionSummaries, selectedStudentId, selectedSectionId],
  );

  const marksBySection = useMemo(() => {
    const map = new Map<string, typeof model.marks>();
    for (const mark of model.marks) {
      if (selectedStudentId && mark.studentId !== selectedStudentId) continue;
      if (selectedSectionId && mark.sectionId !== selectedSectionId) continue;
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
  }, [model.marks, selectedStudentId, selectedSectionId]);

  return (
    <div className={isNarrowParent ? "space-y-5 pb-20" : "space-y-5"}>
      <header className="space-y-3">
        <AdminPageHeader
          title={labels.title}
          lead={labels.lead}
          iconId="calendar"
          artFamily="parent"
          actions={
            !isNarrowParent ? (
              <Button type="button" variant="secondary" onClick={() => setScheduleOpen(true)}>
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                {labels.openSchedule}
              </Button>
            ) : undefined
          }
        />

        {!shellOwnsFocus ? (
          <ParentWardPicker
            options={wardOptions}
            selectedStudentId={selectedStudentId}
            label={wardPickerLabel}
            hint={wardPickerHint}
            basePath={basePath}
            variant={isNarrowParent ? "pwa" : "default"}
            selectId="parent-attendance-ward-picker"
          />
        ) : null}
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
