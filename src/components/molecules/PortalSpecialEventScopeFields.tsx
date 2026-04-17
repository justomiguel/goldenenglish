"use client";

import type { Dictionary } from "@/types/i18n";
import type { PortalSpecialCalendarScope, PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";
import { PORTAL_SPECIAL_CALENDAR_SCOPES, PORTAL_SPECIAL_EVENT_TYPES } from "@/types/portalSpecialCalendar";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

type SpecialAdminDict = Dictionary["dashboard"]["portalCalendar"]["specialAdmin"];

export interface PortalSpecialEventScopeFieldsProps {
  dict: SpecialAdminDict;
  eventType: PortalSpecialEventTypeSlug;
  onEventType: (v: PortalSpecialEventTypeSlug) => void;
  calendarScope: PortalSpecialCalendarScope;
  onCalendarScope: (v: PortalSpecialCalendarScope) => void;
  cohortId: string;
  onCohortId: (v: string) => void;
  sectionId: string;
  onSectionId: (v: string) => void;
  meetingUrl: string;
  onMeetingUrl: (v: string) => void;
  cohorts: { id: string; name: string }[];
  sections: { id: string; name: string; cohort_id: string }[];
  disabled: boolean;
}

export function PortalSpecialEventScopeFields({
  dict,
  eventType,
  onEventType,
  calendarScope,
  onCalendarScope,
  cohortId,
  onCohortId,
  sectionId,
  onSectionId,
  meetingUrl,
  onMeetingUrl,
  cohorts,
  sections,
  disabled,
}: PortalSpecialEventScopeFieldsProps) {
  return (
    <>
      <div className="sm:col-span-2">
        <Label htmlFor="spe-et">{dict.eventTypeLabel}</Label>
        <select
          id="spe-et"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          value={eventType}
          disabled={disabled}
          onChange={(e) => onEventType(e.target.value as PortalSpecialEventTypeSlug)}
        >
          {PORTAL_SPECIAL_EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {dict.eventTypes[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="spe-scope">{dict.scopeLabel}</Label>
        <select
          id="spe-scope"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          value={calendarScope}
          disabled={disabled}
          onChange={(e) => onCalendarScope(e.target.value as PortalSpecialCalendarScope)}
        >
          {PORTAL_SPECIAL_CALENDAR_SCOPES.map((s) => (
            <option key={s} value={s}>
              {dict.scopes[s]}
            </option>
          ))}
        </select>
      </div>
      {calendarScope === "cohort" ? (
        <div className="sm:col-span-2">
          <Label htmlFor="spe-cohort">{dict.cohortPickLabel}</Label>
          <select
            id="spe-cohort"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            value={cohortId}
            disabled={disabled}
            onChange={(e) => onCohortId(e.target.value)}
          >
            <option value="">{dict.cohortPlaceholder}</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {calendarScope === "section" ? (
        <div className="sm:col-span-2">
          <Label htmlFor="spe-section">{dict.sectionPickLabel}</Label>
          <select
            id="spe-section"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            value={sectionId}
            disabled={disabled}
            onChange={(e) => onSectionId(e.target.value)}
          >
            <option value="">{dict.sectionPlaceholder}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Label htmlFor="spe-meet">{dict.meetingUrlLabel}</Label>
        <Input
          id="spe-meet"
          type="url"
          inputMode="url"
          placeholder={dict.meetingUrlPlaceholder}
          value={meetingUrl}
          onChange={(e) => onMeetingUrl(e.target.value)}
          disabled={disabled}
          className="mt-1"
        />
      </div>
    </>
  );
}
