"use client";

import { useEffect, useId } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { SECTION_WEEK_UI_DAY_ORDER } from "@/lib/academics/sectionScheduleWeekColumns";
import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";
import type { SectionScheduleSlot } from "@/types/academics";

type Dict = {
  selectedBlockTitle: string;
  editTimes: string;
  deleteBlock: string;
  closeInspectorAria: string;
  scheduleDayLabel: string;
  scheduleStartLabel: string;
  scheduleEndLabel: string;
  weekdays: Record<ReturnType<typeof sectionScheduleWeekdayKey>, string>;
};

export interface AcademicSectionWeekScheduleBlockInspectorProps {
  slots: SectionScheduleSlot[];
  selectedIndex: number | null;
  setSelectedIndex: (i: number | null) => void;
  updateBlock: (index: number, patch: Partial<SectionScheduleSlot>) => void;
  removeBlock: (index: number) => void;
  disabled?: boolean;
  dict: Dict;
}

export function AcademicSectionWeekScheduleBlockInspector({
  slots,
  selectedIndex,
  setSelectedIndex,
  updateBlock,
  removeBlock,
  disabled = false,
  dict,
}: AcademicSectionWeekScheduleBlockInspectorProps) {
  const baseId = useId();
  const titleId = `${baseId}-week-schedule-inspector-title`;
  const slot = selectedIndex === null ? null : (slots[selectedIndex] ?? null);
  const open = slot !== null && selectedIndex !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setSelectedIndex]);

  if (!open || selectedIndex === null || !slot) return null;

  const dayId = `${baseId}-week-schedule-day`;
  const startId = `${baseId}-week-schedule-start`;
  const endId = `${baseId}-week-schedule-end`;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-testid="week-schedule-inspector-drawer"
      className="flex w-full shrink-0 flex-col rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] lg:w-72"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={titleId} className="text-sm font-semibold text-[var(--color-foreground)]">
            {dict.selectedBlockTitle}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {dict.weekdays[sectionScheduleWeekdayKey(slot.dayOfWeek)]} {slot.startTime}–{slot.endTime}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          aria-label={dict.closeInspectorAria}
          title={dict.closeInspectorAria}
          onClick={() => setSelectedIndex(null)}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={disabled}
          onClick={() => {
            removeBlock(selectedIndex);
            setSelectedIndex(null);
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {dict.deleteBlock}
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.editTimes}</p>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor={dayId}>{dict.scheduleDayLabel}</Label>
              <select
                id={dayId}
                className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:opacity-50"
                disabled={disabled}
                value={String(slot.dayOfWeek)}
                onChange={(e) => updateBlock(selectedIndex, { dayOfWeek: Number(e.target.value) })}
              >
                {SECTION_WEEK_UI_DAY_ORDER.map((dayOfWeek) => (
                  <option key={dayOfWeek} value={String(dayOfWeek)}>
                    {dict.weekdays[sectionScheduleWeekdayKey(dayOfWeek)]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={startId}>{dict.scheduleStartLabel}</Label>
                <Input
                  id={startId}
                  type="time"
                  value={slot.startTime}
                  disabled={disabled}
                  onChange={(e) => updateBlock(selectedIndex, { startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={endId}>{dict.scheduleEndLabel}</Label>
                <Input
                  id={endId}
                  type="time"
                  value={slot.endTime}
                  disabled={disabled}
                  onChange={(e) => updateBlock(selectedIndex, { endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
