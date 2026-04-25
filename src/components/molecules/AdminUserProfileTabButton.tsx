import type { ReactNode } from "react";

export type AdminUserProfileTabId =
  | "summary"
  | "academic"
  | "payments"
  | "family"
  | "security";

export interface AdminUserProfileTabButtonProps {
  active: boolean;
  badge?: string | number | null;
  children: ReactNode;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
  tabId: AdminUserProfileTabId;
  title?: string;
}

export function AdminUserProfileTabButton({
  active,
  badge,
  children,
  disabled = false,
  icon,
  onClick,
  tabId,
  title,
}: AdminUserProfileTabButtonProps) {
  return (
    <button
      id={`student-dossier-tab-${tabId}`}
      role="tab"
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`relative inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/60 hover:text-[var(--color-foreground)]"
      } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-[var(--color-muted-foreground)]`}
      aria-selected={active}
      aria-controls="student-dossier-panel"
      aria-disabled={disabled}
    >
      {icon}
      {children}
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "bg-[var(--color-background)] text-[var(--color-primary)]"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
