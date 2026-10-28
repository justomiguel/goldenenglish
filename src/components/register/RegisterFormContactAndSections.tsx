import { UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterSectionMultiSelect } from "@/components/register/RegisterSectionMultiSelect";
import { RegisterSectionPicker } from "@/components/register/RegisterSectionPicker";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";
import {
  resolveRegisterAssignedSectionLabel,
  resolveRegisterChoosableIds,
  resolveRegisterSectionPickerView,
} from "@/lib/register/resolveRegisterSectionPickerView";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { RegisterPrivacyConsent } from "@/components/register/RegisterPrivacyConsent";
import {
  RegisterTutorFieldset,
  type RegisterTutorPrefillValues,
} from "@/components/register/RegisterTutorFieldset";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

interface RegisterFormContactAndSectionsProps {
  locale: string;
  dict: Dictionary["register"];
  busy: boolean;
  showTutor: boolean;
  showAdultContact: boolean;
  contactRequired?: boolean;
  defaultEmail?: string;
  defaultPhone?: string;
  tutorDefaultValues?: RegisterTutorPrefillValues | null;
  sectionOptions: Array<{ id: string; label: string } & Partial<RegistrationSectionPickerOption>>;
  selectedSectionIds: string[];
  onSelectedSectionIdsChange: (next: string[]) => void;
  enrollmentLink?: SectionEnrollmentLinkContext;
  showAllSections?: boolean;
  intent?: RegisterIntent;
  hidden?: boolean;
  submitType?: "submit" | "button";
  onContinue?: () => void;
}

export function RegisterFormContactAndSections({
  locale,
  dict,
  busy,
  showTutor,
  showAdultContact,
  contactRequired = true,
  defaultEmail = "",
  defaultPhone = "",
  tutorDefaultValues = null,
  sectionOptions,
  selectedSectionIds,
  onSelectedSectionIdsChange,
  enrollmentLink,
  showAllSections = false,
  intent = "reserve",
  hidden = false,
  submitType = "submit",
  onContinue,
}: RegisterFormContactAndSectionsProps) {
  const pickerView = resolveRegisterSectionPickerView({
    choosableIds: resolveRegisterChoosableIds(sectionOptions, intent),
    showAllSections,
  });
  const assignedSectionLabel = resolveRegisterAssignedSectionLabel({
    sectionOptions,
    hiddenPreferredSectionId: pickerView.hiddenPreferredSectionId,
    showPicker: pickerView.showPicker,
    hasEnrollmentLink: Boolean(enrollmentLink),
  });

  return (
    <div className={hidden ? "hidden" : "space-y-4"}>
      {showTutor ? (
        <p className="text-xs text-[var(--color-muted-foreground)]" role="note">
          {dict.studentEmailNotCollectedMinorLead}
        </p>
      ) : null}
      {showAdultContact ? (
        <>
          <div>
            <Label htmlFor="rg-em" required={contactRequired}>{dict.email}</Label>
            <Input
              id="rg-em"
              name="email"
              type="email"
              required={contactRequired}
              autoComplete="email"
              defaultValue={defaultEmail}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <Label htmlFor="rg-ph" required={contactRequired}>{dict.phone}</Label>
            <Input
              id="rg-ph"
              name="phone"
              required={contactRequired}
              autoComplete="tel"
              defaultValue={defaultPhone}
              className="mt-1 w-full"
            />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value="" />
          <input type="hidden" name="phone" value="" readOnly aria-hidden />
        </>
      )}
      {showTutor ? (
        <RegisterTutorFieldset
          dict={dict}
          required={contactRequired}
          defaultValues={tutorDefaultValues}
        />
      ) : null}
      {enrollmentLink ? (
        <SectionEnrollmentLinkCard link={enrollmentLink} labels={dict.sectionLink} />
      ) : null}
      {enrollmentLink ? (
        <RegisterSectionMultiSelect
          dict={dict}
          sectionOptions={sectionOptions}
          selectedIds={selectedSectionIds}
          onChange={onSelectedSectionIdsChange}
          lockedPreferredId={enrollmentLink.sectionId}
        />
      ) : pickerView.showPicker ? (
        <RegisterSectionPicker
          dict={dict}
          options={sectionOptions}
          intent={intent}
          selectedIds={selectedSectionIds}
          onChange={onSelectedSectionIdsChange}
        />
      ) : (
        <>
          <input
            type="hidden"
            name="preferred_section_id"
            value={pickerView.hiddenPreferredSectionId}
            readOnly
          />
          {assignedSectionLabel ? (
            <p className="text-sm text-[var(--color-muted-foreground)]" role="note">
              {dict.assignedSectionLine.replace("{section}", assignedSectionLabel)}
            </p>
          ) : null}
        </>
      )}
      <RegisterPrivacyConsent
        locale={locale}
        label={dict.privacyConsent.label}
        linkLabel={dict.privacyConsent.link}
      />
      {hidden ? null : (
        <Button
          type={submitType}
          disabled={busy}
          isLoading={busy}
          onClick={submitType === "button" ? onContinue : undefined}
        >
          {!busy ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {submitType === "button" ? dict.continue : dict.submit}
        </Button>
      )}
    </div>
  );
}
