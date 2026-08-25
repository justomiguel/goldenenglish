import { SignOutButton } from "@/components/molecules/SignOutButton";

const railClass =
  "w-full min-h-11 justify-start gap-3 rounded-xl px-4 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)]";
const railIconClass = "h-6 w-6 shrink-0";

export function StaffDrawerSignOut({
  locale,
  label,
  title,
}: {
  locale: string;
  label: string;
  title: string;
}) {
  return (
    <div className="mt-auto shrink-0 border-t border-[var(--color-border)] px-3 py-3">
      <SignOutButton
        locale={locale}
        label={label}
        title={title}
        className={railClass}
        iconClassName={railIconClass}
      />
    </div>
  );
}
