"use client";

import type { MonthCaptionProps } from "react-day-picker";
import type { Locale } from "react-day-picker/locale";
import { DayPicker } from "react-day-picker";
import { useMemo, type ReactNode } from "react";

function RegisterBirthOmitCaption(props: MonthCaptionProps) {
  void props;
  return <span className="sr-only" />;
}

export interface RegisterBirthDateCalendarGridProps {
  locale: string;
  tzLocale: Locale;
  weekStartsOnValue: 0 | 1;
  calendarMonth: Date;
  onMonthChange: (d: Date) => void;
  oldest: Date;
  endMonthInclusive: Date;
  todayCutoff: Date;
  selectedNullable: Date | undefined;
  onPickDay: (day: Date | undefined) => void;
  footer: ReactNode;
  birthDateAriaLabel: string;
}

export function RegisterBirthDateCalendarGrid({
  locale,
  tzLocale,
  weekStartsOnValue,
  calendarMonth,
  onMonthChange,
  oldest,
  endMonthInclusive,
  todayCutoff,
  selectedNullable,
  onPickDay,
  footer,
  birthDateAriaLabel,
}: RegisterBirthDateCalendarGridProps) {
  const customComponents = useMemo(
    () => ({
      MonthCaption: RegisterBirthOmitCaption,
    }),
    [],
  );

  return (
    <DayPicker
      className="w-full"
      lang={locale}
      mode="single"
      captionLayout="label"
      hideNavigation
      locale={tzLocale}
      components={customComponents}
      weekStartsOn={weekStartsOnValue}
      animate
      month={calendarMonth}
      onMonthChange={onMonthChange}
      startMonth={oldest}
      endMonth={endMonthInclusive}
      selected={selectedNullable}
      onSelect={(day) => onPickDay(day ?? undefined)}
      disabled={[{ after: todayCutoff }, { before: oldest }]}
      footer={footer}
      aria-label={birthDateAriaLabel}
    />
  );
}
