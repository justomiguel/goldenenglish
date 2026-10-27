import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { RegisterFormContactAndSections } from "@/components/register/RegisterFormContactAndSections";
import { RegisterNagoExtras } from "@/components/register/RegisterNagoExtras";
import { RegisterStudentFieldset } from "@/components/register/RegisterStudentFieldset";
import type { RegisterTutorPrefillValues } from "@/components/register/RegisterTutorFieldset";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import type { Dictionary } from "@/types/i18n";

type RegisterDict = Dictionary["register"];

export function RegisterFormAfterDni({
  locale,
  dict,
  formDict,
  dni,
  onDniChange,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  birthDate,
  onBirthDateChange,
  existingMatch,
  existingLeadText,
  busy,
  showTutor,
  showAdultContact,
  contactRequired,
  defaultEmail,
  defaultPhone,
  tutorDefaults,
  sectionOptions,
  selectedSectionIds,
  onSelectedSectionIdsChange,
  enrollmentLink,
  intent,
  step,
  extrasPack,
  isMinor,
  tutorPrefill,
  signerPrefill,
  onBackToDetails,
  onContinueToExtras,
}: {
  locale: string;
  dict: RegisterDict;
  formDict: RegisterDict;
  dni: string;
  onDniChange: (value: string) => void;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  existingMatch: { firstName: string; lastName: string } | null;
  existingLeadText: string;
  busy: boolean;
  showTutor: boolean;
  showAdultContact: boolean;
  contactRequired: boolean;
  defaultEmail: string;
  defaultPhone: string;
  tutorDefaults: RegisterTutorPrefillValues | null;
  sectionOptions: { id: string; label: string }[];
  selectedSectionIds: string[];
  onSelectedSectionIdsChange: (ids: string[]) => void;
  enrollmentLink?: SectionEnrollmentLinkContext;
  intent: RegisterIntent;
  step: "details" | "extras";
  extrasPack: RegistrationExtrasPackId | null;
  isMinor: boolean;
  tutorPrefill: { name: string; relationship: string; phone: string } | null;
  signerPrefill: { name: string; dni: string };
  onBackToDetails: () => void;
  onContinueToExtras: () => void;
}) {
  return (
    <>
      {existingMatch ? (
        <div
          className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[var(--color-muted)]/40 p-4"
          role="status"
        >
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{dict.existingFoundTitle}</p>
          <p className="text-xs sm:text-sm text-[var(--color-foreground)]">{existingLeadText}</p>
        </div>
      ) : null}
      <RegisterStudentFieldset
        locale={locale}
        dict={formDict}
        dni={dni}
        onDniChange={onDniChange}
        firstName={firstName}
        onFirstNameChange={onFirstNameChange}
        lastName={lastName}
        onLastNameChange={onLastNameChange}
        birthDate={birthDate}
        onBirthDateChange={onBirthDateChange}
        readOnly={false}
      />
      <RegisterFormContactAndSections
        locale={locale}
        dict={formDict}
        busy={busy}
        showTutor={showTutor}
        showAdultContact={showAdultContact}
        contactRequired={contactRequired}
        defaultEmail={defaultEmail}
        defaultPhone={defaultPhone}
        tutorDefaultValues={tutorDefaults}
        sectionOptions={sectionOptions}
        selectedSectionIds={selectedSectionIds}
        onSelectedSectionIdsChange={onSelectedSectionIdsChange}
        enrollmentLink={enrollmentLink}
        intent={intent}
        hidden={step === "extras"}
        submitType={extrasPack === "nago" && step === "details" ? "button" : "submit"}
        onContinue={onContinueToExtras}
      />
      {step === "extras" && extrasPack === "nago" ? (
        <div className="space-y-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={onBackToDetails}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {dict.backToPreviousStep ?? dict.continue}
          </Button>
          <RegisterNagoExtras
            dict={dict}
            isMinor={isMinor}
            busy={busy}
            showUseTutor={Boolean(showTutor && tutorPrefill?.name)}
            tutorPrefill={tutorPrefill}
            signerPrefill={signerPrefill}
          />
        </div>
      ) : null}
    </>
  );
}
