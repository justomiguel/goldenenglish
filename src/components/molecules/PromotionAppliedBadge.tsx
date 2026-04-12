interface PromotionAppliedBadgeProps {
  label: string;
}

export function PromotionAppliedBadge({ label }: PromotionAppliedBadgeProps) {
  return (
    <div
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/15 px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)]"
      role="status"
    >
      <span aria-hidden>🎉</span>
      {label}
    </div>
  );
}
