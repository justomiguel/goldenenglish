"use client";

import { useMemo } from "react";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";
import { ParentAttendancePwaScreen } from "@/components/pwa/organisms/ParentAttendancePwaScreen";
import type { ParentWardOption } from "@/components/parent/ParentWardPicker";
import type { ParentHubModel } from "@/types/parentHub";

type PortalCalDict = Dictionary["dashboard"]["portalCalendar"];

export interface ParentPortalCalendarEntryProps {
  locale: string;
  dict: PortalCalDict;
  attendanceLabels: Dictionary["dashboard"]["parent"]["attendancePwa"];
  wardPickerLabel?: string;
  wardPickerHint?: string;
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  events: PortalCalendarEvent[];
  feedUrl: string | null;
  viewerId?: string;
  attendance: ParentRecentAttendanceModel;
  hub?: ParentHubModel | null;
  hubDict?: Dictionary["dashboard"]["parent"]["hub"];
}

export function ParentPortalCalendarEntry({
  locale,
  dict,
  attendanceLabels,
  wardPickerLabel,
  wardPickerHint,
  wardOptions,
  selectedStudentId,
  events,
  feedUrl,
  viewerId,
  attendance,
}: ParentPortalCalendarEntryProps) {
  const resolvedWardPickerLabel = wardPickerLabel?.trim() || "Student";
  const resolvedWardPickerHint =
    wardPickerHint?.trim() || "Switching the student reloads the view.";

  const scheduleDict = useMemo(
    () => ({
      legend: dict.legend,
      specialTypes: dict.specialTypes,
      schedule: dict.schedule,
    }),
    [dict.legend, dict.specialTypes, dict.schedule],
  );

  const attendanceBody = (
    <ParentAttendancePwaScreen
      locale={locale}
      model={attendance}
      labels={attendanceLabels}
      wardOptions={wardOptions}
      selectedStudentId={selectedStudentId}
      wardPickerLabel={resolvedWardPickerLabel}
      wardPickerHint={resolvedWardPickerHint}
      portalCalendarDict={dict}
      scheduleDict={scheduleDict}
      events={events}
      feedUrl={feedUrl}
      viewerId={viewerId}
    />
  );

  return (
    <SurfaceMountGate
      skeleton={<div className="h-40 animate-pulse rounded bg-[var(--color-muted)]" aria-hidden />}
      desktop={attendanceBody}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{attendanceBody}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
