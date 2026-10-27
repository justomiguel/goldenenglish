import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

export interface RegisterTutorPrefillValues {
  name: string;
  dni: string;
  email: string;
  phone: string;
  relationship: string;
}

interface RegisterTutorFieldsetProps {
  dict: Dictionary["register"];
  required: boolean;
  defaultValues?: RegisterTutorPrefillValues | null;
}

/** Tutor block for a minor student on the public registration form. */
export function RegisterTutorFieldset({
  dict,
  required,
  defaultValues,
}: RegisterTutorFieldsetProps) {
  return (
    <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
        {dict.tutorSectionTitle}
      </legend>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.tutorSectionLead}</p>
      <div>
        <Label htmlFor="rg-tn" required={required}>{dict.tutorName}</Label>
        <Input
          id="rg-tn"
          name="tutor_name"
          required={required}
          defaultValue={defaultValues?.name ?? ""}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="rg-td" required={required}>{dict.tutorDni}</Label>
        <Input
          id="rg-td"
          name="tutor_dni"
          required={required}
          defaultValue={defaultValues?.dni ?? ""}
          className="mt-1 w-full"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.documentIdFormatHint}</p>
      </div>
      <div>
        <Label htmlFor="rg-te" required={required}>{dict.tutorEmail}</Label>
        <Input
          id="rg-te"
          name="tutor_email"
          type="email"
          required={required}
          defaultValue={defaultValues?.email ?? ""}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="rg-tp" required={required}>{dict.tutorPhone}</Label>
        <Input
          id="rg-tp"
          name="tutor_phone"
          required={required}
          defaultValue={defaultValues?.phone ?? ""}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="rg-tr" required={required}>{dict.tutorRelationship}</Label>
        <Input
          id="rg-tr"
          name="tutor_relationship"
          required={required}
          defaultValue={defaultValues?.relationship ?? ""}
          className="mt-1 w-full"
        />
      </div>
    </fieldset>
  );
}
