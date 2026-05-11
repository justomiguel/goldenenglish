import type { Dictionary } from "@/types/i18n";

export interface AdminRegistrationAcceptExplainerProps {
  labels: Dictionary["admin"]["registrations"];
  hasSections: boolean;
}

export function AdminRegistrationAcceptExplainer({
  labels,
  hasSections,
}: AdminRegistrationAcceptExplainerProps) {
  return (
    <div
      className="mt-3 space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-3 py-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]"
      role="note"
    >
      <p>{labels.acceptExplainerAccounts}</p>
      <p>{labels.acceptExplainerOnlineCourse}</p>
      {hasSections ? <p>{labels.acceptExplainerSectionStep}</p> : null}
    </div>
  );
}
