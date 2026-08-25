import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterBirthDateDayPicker } from "@/components/molecules/RegisterBirthDateDayPicker";
import type { Dictionary } from "@/types/i18n";

interface RegisterStudentFieldsetProps {
  locale: string;
  dict: Dictionary["register"];
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  readOnly?: boolean;
}

export function RegisterStudentFieldset({
  locale,
  dict,
  birthDate,
  onBirthDateChange,
  readOnly = false,
}: RegisterStudentFieldsetProps) {
  return (
    <fieldset className={`space-y-4${readOnly ? " pointer-events-none opacity-80" : ""}`}>
      <legend className="text-sm font-semibold text-[var(--color-foreground)]">
        {dict.studentSectionTitle}
      </legend>
      <div>
        <Label htmlFor="rg-fn" required>{dict.firstName}</Label>
        <Input id="rg-fn" name="first_name" required autoComplete="given-name" readOnly={readOnly} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="rg-ln" required>{dict.lastName}</Label>
        <Input id="rg-ln" name="last_name" required autoComplete="family-name" readOnly={readOnly} className="mt-1 w-full" />
      </div>
      <input type="hidden" name="birth_date" value={birthDate} readOnly aria-hidden />
      <RegisterBirthDateDayPicker
        locale={locale}
        birthDateLegendRequired
        labels={{
          birthDate: dict.birthDate,
          birthMonth: dict.birthMonth,
          birthYear: dict.birthYear,
          birthDay: dict.birthDay,
          birthDayPlaceholder: dict.birthDayPlaceholder,
          birthDateHint: dict.birthDateHint,
          birthDatePickPrompt: dict.birthDatePickPrompt,
          birthDatePickedAnnouncement: dict.birthDatePickedAnnouncement,
        }}
        value={birthDate}
        onChange={onBirthDateChange}
      />
      <div>
        <Label htmlFor="rg-dni" required>{dict.dni}</Label>
        <Input id="rg-dni" name="dni" required autoComplete="off" readOnly={readOnly} className="mt-1 w-full" />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.documentIdFormatHint}</p>
      </div>
    </fieldset>
  );
}
