import type { Dictionary } from "@/types/i18n";

export function RegistrationExistingStudentBadge({
  labels,
}: {
  labels: Dictionary["admin"]["registrations"];
}) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-foreground)]">
      {labels.existingStudentBadge}
    </span>
  );
}
