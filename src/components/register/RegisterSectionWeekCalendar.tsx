import { AcademicSectionWeekScheduleGridHourLines } from "@/components/organisms/AcademicSectionWeekScheduleGridHourLines";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";
import { SECTION_WEEK_UI_DAY_ORDER } from "@/lib/academics/sectionScheduleWeekColumns";
import { listSectionScheduleHourTicks } from "@/lib/academics/sectionScheduleHourTicks";
import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";
import {
  assignRegisterPickerOverlapColumns,
  registerPickerSectionShortName,
  resolveRegisterPickerWeekWindowMinutes,
  type RegisterPickerCell,
} from "@/lib/register/registrationSectionPicker";
import {
  registerPickerSectionToneIndex,
  registerPickerSectionToneStyle,
} from "@/lib/register/registerPickerSectionTone";
import type { Dictionary } from "@/types/i18n";

/** Taller than the admin editor so public slots stay readable as form chips. */
const PX_PER_MINUTE = 0.85;

function cellsByDay(cells: RegisterPickerCell[]): Map<number, RegisterPickerCell[]> {
  const map = new Map<number, RegisterPickerCell[]>();
  for (const cell of cells) {
    const list = map.get(cell.dayOfWeek) ?? [];
    list.push(cell);
    map.set(cell.dayOfWeek, list);
  }
  return map;
}

export function RegisterSectionWeekCalendar({
  dict,
  cells,
  selectedIds,
  onToggleSection,
}: {
  dict: Dictionary["register"];
  cells: RegisterPickerCell[];
  selectedIds: string[];
  onToggleSection: (sectionId: string) => void;
}) {
  const weekdays = dict.sectionLink.weekdays;
  const windowMinutes = resolveRegisterPickerWeekWindowMinutes(cells);
  const heightPx = Math.max(1, (windowMinutes.end - windowMinutes.start) * PX_PER_MINUTE);
  const hourTicks = listSectionScheduleHourTicks(windowMinutes.start, windowMinutes.end);
  const byDay = cellsByDay(cells);
  const sectionIds = cells.map((cell) => cell.sectionId);

  return (
    <div
      role="grid"
      aria-label={dict.picker.calendarAria}
      data-testid="register-week-calendar"
      className="w-full min-w-0 max-w-full overflow-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25"
    >
      <div className="min-w-[40rem] p-3">
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-1.5">
          <div
            aria-hidden
            className="sticky top-0 z-[3] bg-[var(--color-muted)]/90"
          />
          <div className="sticky top-0 z-[3] grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-muted)]/90 pb-2 backdrop-blur-sm">
            {SECTION_WEEK_UI_DAY_ORDER.map((dayOfWeek) => (
              <div
                key={dayOfWeek}
                className="border-r border-[var(--color-border)]/50 text-center text-[11px] font-semibold tracking-wide text-[var(--color-muted-foreground)] last:border-r-0"
              >
                {weekdays[sectionScheduleWeekdayKey(dayOfWeek)]}
              </div>
            ))}
          </div>

          <div
            className="relative sticky left-0 z-[2] bg-[var(--color-muted)]/90"
            style={{ height: heightPx }}
            data-testid="register-week-time-gutter"
          >
            <AcademicSectionWeekScheduleGridHourLines
              hourTicks={hourTicks}
              windowStartMinutes={windowMinutes.start}
              pxPerMinute={PX_PER_MINUTE}
              gutterOnly
            />
          </div>

          <div
            className="relative grid grid-cols-7 overflow-hidden rounded-[calc(var(--layout-border-radius)-2px)] border border-[var(--color-border)] bg-[var(--color-surface)]"
            style={{ height: heightPx }}
          >
            <AcademicSectionWeekScheduleGridHourLines
              hourTicks={hourTicks}
              windowStartMinutes={windowMinutes.start}
              pxPerMinute={PX_PER_MINUTE}
            />
            {SECTION_WEEK_UI_DAY_ORDER.map((dayOfWeek, dayIndex) => {
              const dayCells = byDay.get(dayOfWeek) ?? [];
              const overlap = assignRegisterPickerOverlapColumns(dayCells);
              return (
              <div
                key={dayOfWeek}
                role="gridcell"
                data-testid={`register-week-day-${dayOfWeek}`}
                className={`relative min-w-0 border-r border-[var(--color-border)] last:border-r-0 ${
                  dayIndex % 2 === 0 ? "bg-[var(--color-muted)]/20" : "bg-[var(--color-surface)]"
                }`}
              >
                {dayCells.map((cell) => {
                  const selected = selectedIds.includes(cell.sectionId);
                  const start = timeToMinutes(cell.startTime);
                  const end = timeToMinutes(cell.endTime);
                  const topPx = (start - windowMinutes.start) * PX_PER_MINUTE;
                  const height = Math.max(36, (end - start) * PX_PER_MINUTE);
                  const layout = overlap.get(
                    `${cell.sectionId}-${cell.dayOfWeek}-${cell.startTime}-${cell.endTime}`,
                  ) ?? { col: 0, colCount: 1 };
                  const widthPct = 100 / layout.colCount;
                  const shortName = registerPickerSectionShortName(cell.label);
                  const label = `${shortName} ${cell.startTime}–${cell.endTime}`;
                  const tone = cell.disabled
                    ? null
                    : registerPickerSectionToneStyle(
                        cell.sectionId,
                        selected ? "strong" : "soft",
                        sectionIds,
                      );
                  return (
                    <button
                      key={`${cell.sectionId}-${cell.dayOfWeek}-${cell.startTime}`}
                      type="button"
                      disabled={cell.disabled}
                      aria-pressed={selected}
                      aria-label={cell.disabled ? `${label} (${dict.picker.slotFull})` : label}
                      data-section-tone={
                        cell.disabled
                          ? undefined
                          : String(registerPickerSectionToneIndex(cell.sectionId, sectionIds))
                      }
                      onClick={() => onToggleSection(cell.sectionId)}
                      className={`absolute z-[2] overflow-hidden rounded-[calc(var(--layout-border-radius)-2px)] border px-1 py-1 text-left text-[11px] leading-tight ${
                        cell.disabled
                          ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted-foreground)] opacity-60"
                          : "shadow-sm"
                      }`}
                      style={{
                        top: topPx,
                        height,
                        left: `calc(${layout.col * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        ...tone,
                      }}
                    >
                      <span className="block truncate font-medium">{shortName}</span>
                      {cell.disabled ? (
                        <span className="mt-0.5 block">{dict.picker.slotFull}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
