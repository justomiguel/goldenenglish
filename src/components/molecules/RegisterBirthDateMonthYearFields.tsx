"use client";

import { Label } from "@/components/atoms/Label";
import { REGISTER_NATIVE_SELECT_CN } from "@/components/register/registerFormNativeSelectCn";

export interface RegisterBirthDateMonthYearFieldsProps {
  birthMonthLabel: string;
  birthYearLabel: string;
  monthFormatter: Intl.DateTimeFormat;
  calendarMonthMonthIndex: number;
  calendarMonthYear: number;
  minMonthIdx: number;
  maxMonthIdx: number;
  yearOptionsDisabled: boolean;
  yearOptionValuesDesc: readonly number[];
  onPickMonthIndex: (idx: number) => void;
  onPickYear: (year: number) => void;
}

export function RegisterBirthDateMonthYearFields({
  birthMonthLabel,
  birthYearLabel,
  monthFormatter,
  calendarMonthMonthIndex,
  calendarMonthYear,
  minMonthIdx,
  maxMonthIdx,
  yearOptionsDisabled,
  yearOptionValuesDesc,
  onPickMonthIndex,
  onPickYear,
}: RegisterBirthDateMonthYearFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div className="min-w-0">
        <Label htmlFor="rg-birth-month" className="text-xs text-[var(--color-muted-foreground)]">
          {birthMonthLabel}
        </Label>
        <select
          id="rg-birth-month"
          className={`${REGISTER_NATIVE_SELECT_CN} mt-1`}
          value={calendarMonthMonthIndex}
          aria-label={birthMonthLabel}
          data-register-birth-month=""
          disabled={yearOptionsDisabled}
          onChange={(e) => onPickMonthIndex(Number(e.target.value))}
        >
          {Array.from({ length: maxMonthIdx - minMonthIdx + 1 }, (_, i) => {
            const mi = minMonthIdx + i;
            return (
              <option key={mi} value={mi}>
                {monthFormatter.format(new Date(2020, mi, 1))}
              </option>
            );
          })}
        </select>
      </div>
      <div className="min-w-0">
        <Label htmlFor="rg-birth-year" className="text-xs text-[var(--color-muted-foreground)]">
          {birthYearLabel}
        </Label>
        <select
          id="rg-birth-year"
          className={`${REGISTER_NATIVE_SELECT_CN} mt-1`}
          value={calendarMonthYear}
          aria-label={birthYearLabel}
          data-register-birth-year=""
          disabled={yearOptionsDisabled}
          onChange={(e) => onPickYear(Number(e.target.value))}
        >
          {yearOptionValuesDesc.map((yv) => (
            <option key={yv} value={yv}>
              {yv}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
