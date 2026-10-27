import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

interface RegisterDniStepProps {
  dict: Dictionary["register"];
  dni: string;
  onDniChange: (value: string) => void;
  busy: boolean;
  enrollmentLink?: SectionEnrollmentLinkContext;
  onContinue: () => void;
}

export function RegisterDniStep({
  dict,
  dni,
  onDniChange,
  busy,
  enrollmentLink,
  onContinue,
}: RegisterDniStepProps) {
  return (
    <div className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">
          {dict.studentSectionTitle}
        </legend>
        {dict.dniStepLead ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {dict.dniStepLead}
          </p>
        ) : null}
        <div>
          <Label htmlFor="rg-dni" required>
            {dict.dni}
          </Label>
          <Input
            id="rg-dni"
            name="dni"
            required
            autoComplete="off"
            value={dni}
            onChange={(e) => onDniChange(e.target.value)}
            className="mt-1 w-full"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {dict.documentIdFormatHint}
          </p>
        </div>
      </fieldset>
      {enrollmentLink ? (
        <SectionEnrollmentLinkCard link={enrollmentLink} labels={dict.sectionLink} />
      ) : null}
      <Button
        type="button"
        disabled={busy}
        isLoading={busy}
        onClick={onContinue}
      >
        {dict.continue}
      </Button>
    </div>
  );
}
