import type { Dictionary } from "@/types/i18n";

export function ParentProgressEmptyState({
  copy,
}: {
  copy: Dictionary["dashboard"]["parent"]["progressPicker"];
}) {
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center">
      <p className="text-base font-semibold text-[var(--color-foreground)]">{copy.emptyTitle}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
        {copy.emptyBody}
      </p>
    </div>
  );
}
