"use client";

import { useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import { UserMinus, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface ScheduleConflictResolutionModalProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  dict: {
    title: string;
    lead: string;
    currentSection: string;
    newSection: string;
    slotLegend: string;
    cancel: string;
    confirmDrop: string;
    pending: string;
  };
  conflicts: SectionEnrollmentConflict[];
  targetSlots: SectionScheduleSlot[];
  targetSectionLabel: string;
  onConfirmDrop: (enrollmentId: string) => void;
  isPending?: boolean;
}

function daysForSlots(slots: SectionScheduleSlot[]): Set<number> {
  return new Set(slots.map((s) => s.dayOfWeek));
}

export function ScheduleConflictResolutionModal({
  open,
  onClose,
  locale,
  dict,
  conflicts,
  targetSlots,
  targetSectionLabel,
  onConfirmDrop,
  isPending = false,
}: ScheduleConflictResolutionModalProps) {
  const primary = conflicts[0];
  const targetDays = useMemo(() => daysForSlots(targetSlots), [targetSlots]);
  const conflictDays = useMemo(
    () => (primary ? daysForSlots(primary.scheduleSlots) : new Set<number>()),
    [primary],
  );

  if (!open || !primary) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      titleId="academic-schedule-conflict-title"
      descriptionId="academic-schedule-conflict-desc"
      title={dict.title}
      ariaLabel={dict.title}
      disableClose={isPending}
      dialogClassName="max-w-4xl border-[var(--color-error)] ring-2 ring-[var(--color-error)]/25"
    >
      <p id="academic-schedule-conflict-desc" className="text-sm text-[var(--color-muted-foreground)]">
        {dict.lead}
      </p>
      <div className="academic-conflict-calendars mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.currentSection}: {primary.sectionName}
          </p>
          <Calendar
            locale={locale}
            tileClassName={({ date }) => {
              const d = date.getDay();
              return conflictDays.has(d) ? "academic-cal-tile-busy" : "";
            }}
          />
          <ul className="mt-2 space-y-1 text-xs text-[var(--color-foreground)]">
            {primary.scheduleSlots.map((s) => (
              <li key={`${s.dayOfWeek}-${s.startTime}`}>
                {dict.slotLegend}: {s.dayOfWeek} {s.startTime}–{s.endTime}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.newSection}: {targetSectionLabel}
          </p>
          <Calendar
            locale={locale}
            tileClassName={({ date }) => {
              const d = date.getDay();
              return targetDays.has(d) ? "academic-cal-tile-target" : "";
            }}
          />
          <ul className="mt-2 space-y-1 text-xs text-[var(--color-foreground)]">
            {targetSlots.map((s) => (
              <li key={`t-${s.dayOfWeek}-${s.startTime}`}>
                {dict.slotLegend}: {s.dayOfWeek} {s.startTime}–{s.endTime}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={isPending} onClick={onClose}>
          {!isPending ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.cancel}
        </Button>
        <Button
          type="button"
          isLoading={isPending}
          disabled={isPending}
          onClick={() => onConfirmDrop(primary.enrollmentId)}
          aria-busy={isPending}
        >
          {!isPending ? <UserMinus className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.confirmDrop}
        </Button>
      </div>
    </Modal>
  );
}
