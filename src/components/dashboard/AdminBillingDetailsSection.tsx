"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface AdminBillingDetailsSectionProps {
  title: string;
  summary: string;
  children: ReactNode;
}

export function AdminBillingDetailsSection({
  title,
  summary,
  children,
}: AdminBillingDetailsSectionProps) {
  return (
    <details className="group rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-[var(--color-secondary)]">
            {title}
          </span>
          <span className="block text-xs text-[var(--color-muted-foreground)]">
            {summary}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-[var(--color-border)] p-4">{children}</div>
    </details>
  );
}
