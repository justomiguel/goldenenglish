import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

interface RegisterExistingStudentConfirmProps {
  dict: Dictionary["register"];
  firstName: string;
  lastName: string;
  onYes: () => void;
  onNo: () => void;
}

export function RegisterExistingStudentConfirm({
  dict,
  firstName,
  lastName,
  onYes,
  onNo,
}: RegisterExistingStudentConfirmProps) {
  const lead = dict.existingFoundLead
    .replace("{firstName}", firstName)
    .replace("{lastName}", lastName);

  return (
    <div
      className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4"
      role="group"
      aria-labelledby="rg-existing-title"
    >
      <h2 id="rg-existing-title" className="text-sm font-semibold text-[var(--color-foreground)]">
        {dict.existingFoundTitle}
      </h2>
      <p className="text-sm text-[var(--color-foreground)]">{lead}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onYes}>
          {dict.existingYes}
        </Button>
        <Button type="button" variant="secondary" onClick={onNo}>
          {dict.existingNo}
        </Button>
      </div>
    </div>
  );
}
