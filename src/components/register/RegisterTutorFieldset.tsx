import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

interface RegisterTutorFieldsetProps {
  dict: Dictionary["register"];
  required: boolean;
}

/** Tutor block for a minor student on the public registration form. */
export function RegisterTutorFieldset({
  dict,
  required,
}: RegisterTutorFieldsetProps) {
  return (
    <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
        {dict.tutorSectionTitle}
      </legend>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.tutorSectionLead}</p>
      <div>
        <Label htmlFor="rg-tn" required>{dict.tutorName}</Label>
        <Input id="rg-tn" name="tutor_name" required={required} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="rg-td" required>{dict.tutorDni}</Label>
        <Input id="rg-td" name="tutor_dni" required={required} className="mt-1 w-full" />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.documentIdFormatHint}</p>
      </div>
      <div>
        <Label htmlFor="rg-te" required>{dict.tutorEmail}</Label>
        <Input id="rg-te" name="tutor_email" type="email" required={required} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="rg-tp" required>{dict.tutorPhone}</Label>
        <Input id="rg-tp" name="tutor_phone" required={required} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="rg-tr" required>{dict.tutorRelationship}</Label>
        <Input id="rg-tr" name="tutor_relationship" required={required} className="mt-1 w-full" />
      </div>
    </fieldset>
  );
}
