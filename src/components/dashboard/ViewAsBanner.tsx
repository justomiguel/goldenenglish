"use client";

import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { ViewAsSubject } from "@/lib/dashboard/viewAsTypes";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import { clearViewAsAction } from "@/lib/dashboard/viewAsActions";

export function ViewAsBanner({
  locale,
  dict,
  viewAs,
}: {
  locale: string;
  dict: Dictionary;
  viewAs: ViewAsSubject;
}) {
  const router = useRouter();
  const labels = dict.dashboard.viewAs;
  const roleLabel = adminUserRoleOptionLabel(dict.admin.users, viewAs.role);
  const text = labels.banner.replaceAll("{{name}}", viewAs.displayName).replaceAll("{{role}}", roleLabel);

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3"
    >
      <p className="text-sm font-medium text-[var(--color-primary)]">{text}</p>
      <button
        type="button"
        className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
        onClick={() => {
          void clearViewAsAction(locale).then((result) => {
            router.push(result.href);
            router.refresh();
          });
        }}
      >
        {labels.backToAdmin}
      </button>
    </div>
  );
}
