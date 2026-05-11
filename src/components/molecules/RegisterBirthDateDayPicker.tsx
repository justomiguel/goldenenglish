"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { enUS, es } from "react-day-picker/locale";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Label } from "@/components/atoms/Label";
import { clampBirthCalendarViewMonth, startOfUtcMonth } from "@/lib/register/birthCalendarViewMonth";
import {
  isoYmdFromLocalDate,
  localNoonDateFromIsoYmd,
  parseIsoBirthDateParts,
} from "@/lib/register/birthDateTriplet";
import type { Dictionary } from "@/types/i18n";
import { REGISTER_NATIVE_SELECT_CN } from "@/components/register/registerFormNativeSelectCn";

import "react-day-picker/style.css";

import { RegisterBirthDateCalendarGrid } from "./RegisterBirthDateCalendarGrid";
import { RegisterBirthDateMonthYearFields } from "./RegisterBirthDateMonthYearFields";

interface RegisterBirthDateDayPickerProps {
  locale: string;
  /** Asterisk next to legend; matches RegisterForm mandatory birth date rule. */
  birthDateLegendRequired?: boolean;
  labels: Pick<
    Dictionary["register"],
    | "birthDate"
    | "birthMonth"
    | "birthYear"
    | "birthDay"
    | "birthDayPlaceholder"
    | "birthDateHint"
    | "birthDatePickPrompt"
    | "birthDatePickedAnnouncement"
  >;
  value: string;
  onChange: (isoYYYYMMDD: string) => void;
}

function pickerLocale(code: string) {
  return code.startsWith("es") ? es : enUS;
}

function weekStartsOn(code: string): 0 | 1 {
  return code.startsWith("es") ? 1 : 0;
}

export function RegisterBirthDateDayPicker({
  locale,
  birthDateLegendRequired,
  labels,
  value,
  onChange,
}: RegisterBirthDateDayPickerProps) {
  const tzLocale = pickerLocale(locale);
  const selected = localNoonDateFromIsoYmd(value);

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const oldest = new Date(y - 120, 0, 1);
  const todayCutoff = new Date(y, m, d);
  const earliestMonthStart = startOfUtcMonth(oldest);
  const latestMonthStart = startOfUtcMonth(now);

  const desiredCalendarMonth = (() => {
    if (!value || value.length !== 10) {
      return clampBirthCalendarViewMonth(
        new Date(y - 12, m, 1),
        earliestMonthStart,
        latestMonthStart,
      );
    }
    const pv = parseIsoBirthDateParts(value);
    if (!pv) {
      return clampBirthCalendarViewMonth(
        new Date(y - 12, m, 1),
        earliestMonthStart,
        latestMonthStart,
      );
    }
    const next = startOfUtcMonth(new Date(pv.y, pv.m - 1, 1));
    return clampBirthCalendarViewMonth(next, earliestMonthStart, latestMonthStart);
  })();

  /** When the ISO value changes (picker or parent), drop explicit month navigation. */
  const [userNavMonth, setUserNavMonth] = useState<Date | null>(null);
  useEffect(() => {
    queueMicrotask(() => setUserNavMonth(null));
  }, [value]);

  const calendarMonth =
    userNavMonth ?? desiredCalendarMonth;

  const [calendarOpen, setCalendarOpen] = useState(false);

  const longBirthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    [locale],
  );

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }),
    [locale],
  );

  const minCalendarYear = earliestMonthStart.getFullYear();
  const maxCalendarYear = latestMonthStart.getFullYear();
  const yearOptions = (() => {
    const out: number[] = [];
    for (let year = maxCalendarYear; year >= minCalendarYear; year--) {
      out.push(year);
    }
    return out;
  })();

  const viewYear = calendarMonth.getFullYear();
  const minMonthIdx =
    viewYear === earliestMonthStart.getFullYear() ? earliestMonthStart.getMonth() : 0;
  const maxMonthIdx =
    viewYear === latestMonthStart.getFullYear() ? latestMonthStart.getMonth() : 11;

  const onPickYear = (nextYear: number) => {
    const mi = calendarMonth.getMonth();
    const minMi =
      nextYear === earliestMonthStart.getFullYear() ? earliestMonthStart.getMonth() : 0;
    const maxMi =
      nextYear === latestMonthStart.getFullYear() ? latestMonthStart.getMonth() : 11;
    const clampedMi = Math.min(Math.max(mi, minMi), maxMi);
    setUserNavMonth(
      clampBirthCalendarViewMonth(new Date(nextYear, clampedMi, 1), earliestMonthStart, latestMonthStart),
    );
    setCalendarOpen(true);
  };

  const onPickMonth = (monthIdx: number) => {
    setUserNavMonth(
      clampBirthCalendarViewMonth(new Date(viewYear, monthIdx, 1), earliestMonthStart, latestMonthStart),
    );
    setCalendarOpen(true);
  };

  const footer: ReactNode = selected
    ? `${labels.birthDatePickedAnnouncement}: ${longBirthLabel.format(selected)}`
    : labels.birthDatePickPrompt;

  return (
    <fieldset
      className="border-0 p-0"
      {...(birthDateLegendRequired ? { "aria-required": true as const } : {})}
    >
      <legend
        className={`mb-0.5 inline-flex items-center text-xs font-medium text-[var(--color-foreground)] sm:text-sm ${
          birthDateLegendRequired
            ? "after:ml-1 after:inline after:text-[var(--color-error)] after:content-['*']"
            : ""
        }`}
      >
        {labels.birthDate}
      </legend>
      <div className="register-day-picker-scope mt-1 w-full max-w-full space-y-2">
        <RegisterBirthDateMonthYearFields
          birthMonthLabel={labels.birthMonth}
          birthYearLabel={labels.birthYear}
          monthFormatter={monthFormatter}
          calendarMonthMonthIndex={calendarMonth.getMonth()}
          calendarMonthYear={calendarMonth.getFullYear()}
          minMonthIdx={minMonthIdx}
          maxMonthIdx={maxMonthIdx}
          yearOptionsDisabled={yearOptions.length === 0}
          yearOptionValuesDesc={yearOptions}
          onPickMonthIndex={onPickMonth}
          onPickYear={onPickYear}
        />
        <div>
          <Label htmlFor="rg-birth-day-trigger" className="text-xs text-[var(--color-muted-foreground)]">
            {labels.birthDay}
          </Label>
          <button
            id="rg-birth-day-trigger"
            type="button"
            className={`${REGISTER_NATIVE_SELECT_CN} mt-1 flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 text-left text-[var(--color-foreground)]`}
            aria-expanded={calendarOpen}
            aria-controls="rg-birth-calendar-panel"
            aria-label={
              selected
                ? `${labels.birthDay}: ${longBirthLabel.format(selected)}`
                : `${labels.birthDay}: ${labels.birthDayPlaceholder}`
            }
            data-register-birth-calendar-toggle=""
            onClick={() => setCalendarOpen((o) => !o)}
          >
            <span className="inline-flex min-w-0 flex-1 items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
              <span className={selected ? "" : "text-[var(--color-muted-foreground)]"}>
                {selected ? longBirthLabel.format(selected) : labels.birthDayPlaceholder}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200 ${calendarOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>
        <div
          id="rg-birth-calendar-panel"
          hidden={!calendarOpen}
          className="flex min-h-0 w-full justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/35 px-2 py-2 sm:px-3"
        >
          {calendarOpen ? (
            <RegisterBirthDateCalendarGrid
              locale={locale}
              tzLocale={tzLocale}
              weekStartsOnValue={weekStartsOn(locale)}
              calendarMonth={calendarMonth}
              onMonthChange={(nextMonth) =>
                setUserNavMonth(
                  clampBirthCalendarViewMonth(nextMonth, earliestMonthStart, latestMonthStart),
                )
              }
              oldest={oldest}
              endMonthInclusive={new Date(y, m, 1)}
              todayCutoff={todayCutoff}
              selectedNullable={selected}
              onPickDay={(day) => {
                onChange(day ? isoYmdFromLocalDate(day) : "");
                if (day) setCalendarOpen(false);
              }}
              footer={footer}
              birthDateAriaLabel={labels.birthDate}
            />
          ) : null}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">{labels.birthDateHint}</p>
    </fieldset>
  );
}
