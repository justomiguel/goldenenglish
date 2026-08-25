import { UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterSectionMultiSelect } from "@/components/register/RegisterSectionMultiSelect";
import { RegisterTutorFieldset } from "@/components/register/RegisterTutorFieldset";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

interface RegisterFormContactAndSectionsProps {
  dict: Dictionary["register"];
  busy: boolean;
  showTutor: boolean;
  showAdultContact: boolean;
  sectionOptions: { id: string; label: string }[];
  selectedSectionIds: string[];
  onSelectedSectionIdsChange: (next: string[]) => void;
  enrollmentLink?: SectionEnrollmentLinkContext;
}

export function RegisterFormContactAndSections({
  dict,
  busy,
  showTutor,
  showAdultContact,
  sectionOptions,
  selectedSectionIds,
  onSelectedSectionIdsChange,
  enrollmentLink,
}: RegisterFormContactAndSectionsProps) {
  return (
    <>
      {showTutor ? (
        <p className="text-xs text-[var(--color-muted-foreground)]" role="note">
          {dict.studentEmailNotCollectedMinorLead}
        </p>
      ) : null}
      {showAdultContact ? (
        <>
          <div>
            <Label htmlFor="rg-em" required>{dict.email}</Label>
            <Input id="rg-em" name="email" type="email" required autoComplete="email" className="mt-1 w-full" />
          </div>
          <div>
            <Label htmlFor="rg-ph" required>{dict.phone}</Label>
            <Input id="rg-ph" name="phone" required autoComplete="tel" className="mt-1 w-full" />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value="" />
          <input type="hidden" name="phone" value="" readOnly aria-hidden />
        </>
      )}
      {showTutor ? <RegisterTutorFieldset dict={dict} required={showTutor} /> : null}
      {enrollmentLink ? (
        <SectionEnrollmentLinkCard link={enrollmentLink} labels={dict.sectionLink} />
      ) : null}
      <RegisterSectionMultiSelect
        dict={dict}
        sectionOptions={sectionOptions}
        selectedIds={selectedSectionIds}
        onChange={onSelectedSectionIdsChange}
        lockedPreferredId={enrollmentLink?.sectionId ?? null}
      />
      <Button type="submit" disabled={busy} isLoading={busy}>
        {!busy ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {dict.submit}
      </Button>
    </>
  );
}
