"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateEnrollmentRetentionWatchAdminAction } from "@/app/[locale]/dashboard/admin/retentionActions";

export interface AdminRetentionWatchToggleProps {
  locale: string;
  enrollmentId: string;
  initialWatch: boolean;
  ariaLabel: string;
}

export function AdminRetentionWatchToggle({
  locale,
  enrollmentId,
  initialWatch,
  ariaLabel,
}: AdminRetentionWatchToggleProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={ariaLabel}
      aria-pressed={initialWatch}
      className={`min-h-[44px] min-w-[44px] rounded-[var(--layout-border-radius)] border-2 px-3 text-sm font-semibold transition ${
        initialWatch
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      }`}
      onClick={() => {
        start(async () => {
          const fd = new FormData();
          fd.set(
            "payload",
            JSON.stringify({ locale, enrollmentId, watch: !initialWatch }),
          );
          const res = await updateEnrollmentRetentionWatchAdminAction(null, fd);
          if (res.ok) router.refresh();
        });
      }}
    >
      {initialWatch ? "✓" : "—"}
    </button>
  );
}
