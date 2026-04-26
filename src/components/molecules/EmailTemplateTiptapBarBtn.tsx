"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";

export function EmailTemplateTiptapBarBtn({
  children,
  pressed,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  pressed: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      aria-pressed={pressed}
      title={label}
      aria-label={label}
      className={`!px-1.5 !py-1 ${pressed ? "bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]" : ""}`}
      onClick={onClick}
    >
      <span className="inline-flex shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0">
        {children}
      </span>
    </Button>
  );
}
