import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterBirthDateDayPicker } from "@/components/molecules/RegisterBirthDateDayPicker";
import type { Dictionary } from "@/types/i18n";

interface RegisterStudentFieldsetProps {
  locale: string;
  dict: Dictionary["register"];
  dni?: string;
  onDniChange?: (value: string) => void;
  firstName?: string;
  onFirstNameChange?: (value: string) => void;
  lastName?: string;
  onLastNameChange?: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  readOnly?: boolean;
}

export function RegisterStudentFieldset({
  locale,
  dict,
  dni,
  onDniChange,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
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
        <Label htmlFor="rg-dni" required>{dict.dni}</Label>
        <Input
          id="rg-dni"
          name="dni"
          required
          autoComplete="off"
          readOnly={readOnly}
          value={dni}
          onChange={onDniChange ? (e) => onDniChange(e.target.value) : undefined}
          className="mt-1 w-full"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.documentIdFormatHint}</p>
      </div>
      <div>
        <Label htmlFor="rg-fn" required>{dict.firstName}</Label>
        <Input
          id="rg-fn"
          name="first_name"
          required
          autoComplete="given-name"
          readOnly={readOnly}
          value={firstName}
          onChange={onFirstNameChange ? (e) => onFirstNameChange(e.target.value) : undefined}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="rg-ln" required>{dict.lastName}</Label>
        <Input
          id="rg-ln"
          name="last_name"
          required
          autoComplete="family-name"
          readOnly={readOnly}
          value={lastName}
          onChange={onLastNameChange ? (e) => onLastNameChange(e.target.value) : undefined}
          className="mt-1 w-full"
        />
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
    </fieldset>
  );
}
