import type { ReactNode } from "react";

export function AdminSurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </div>
  );
}
