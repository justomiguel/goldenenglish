"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { SectionScheduleSlotDraft } from "@/lib/academics/sectionScheduleDrafts";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface SectionScheduleFieldsDict {
  scheduleHint: string;
  scheduleAddSlot: string;
  scheduleRemoveSlot: string;
  scheduleDayLabel: string;
  scheduleStartLabel: string;
  scheduleEndLabel: string;
  weekdays: Record<(typeof DAY_KEYS)[number], string>;
}

export interface SectionScheduleFieldsProps {
  rows: SectionScheduleSlotDraft[];
  onChange: (rows: SectionScheduleSlotDraft[]) => void;
  dict: SectionScheduleFieldsDict;
  disabled?: boolean;
}

export function SectionScheduleFields({
  rows,
  onChange,
  dict,
  disabled = false,
}: SectionScheduleFieldsProps) {
  const updateRow = (
    index: number,
    patch: Partial<SectionScheduleSlotDraft>,
  ) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.scheduleHint}</p>

      {rows.length === 0 ? null : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${index}-${row.dayOfWeek}-${row.startTime}-${row.endTime}`}
              className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              {/* No viewport sm: grid here — this often sits in max-w-md modals; sm: used the window width and clipped type="time". */}
              <div>
                <Label htmlFor={`section-schedule-day-${index}`}>{dict.scheduleDayLabel}</Label>
                <select
                  id={`section-schedule-day-${index}`}
                  className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                  value={row.dayOfWeek}
                  onChange={(event) => updateRow(index, { dayOfWeek: event.target.value })}
                  disabled={disabled}
                >
                  <option value="" />
                  {DAY_KEYS.map((key, dayIndex) => (
                    <option key={key} value={String(dayIndex)}>
                      {dict.weekdays[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <Label htmlFor={`section-schedule-start-${index}`}>{dict.scheduleStartLabel}</Label>
                  <Input
                    id={`section-schedule-start-${index}`}
                    type="time"
                    className="mt-1 w-full min-w-[7.25rem] tabular-nums"
                    value={row.startTime}
                    onChange={(event) => updateRow(index, { startTime: event.target.value })}
                    disabled={disabled}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor={`section-schedule-end-${index}`}>{dict.scheduleEndLabel}</Label>
                  <Input
                    id={`section-schedule-end-${index}`}
                    type="time"
                    className="mt-1 w-full min-w-[7.25rem] tabular-nums"
                    value={row.endTime}
                    onChange={(event) => updateRow(index, { endTime: event.target.value })}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-[var(--color-border)]/60 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[44px]"
                  title={dict.scheduleRemoveSlot}
                  aria-label={dict.scheduleRemoveSlot}
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  {dict.scheduleRemoveSlot}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="min-h-[44px]"
        onClick={() =>
          onChange([
            ...rows,
            {
              dayOfWeek: "",
              startTime: "",
              endTime: "",
            },
          ])
        }
        disabled={disabled}
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        {dict.scheduleAddSlot}
      </Button>
    </div>
  );
}
