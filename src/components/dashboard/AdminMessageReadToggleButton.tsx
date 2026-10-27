"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen } from "lucide-react";
import { setAdminPortalMessageReadState } from "@/app/[locale]/dashboard/admin/messages/readStateActions";
import type { Dictionary } from "@/types/i18n";

interface AdminMessageReadToggleButtonProps {
  locale: string;
  messageId: string;
  isUnread: boolean;
  labels: Dictionary["admin"]["messages"];
}

export function AdminMessageReadToggleButton({
  locale,
  messageId,
  isUnread,
  labels,
}: AdminMessageReadToggleButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const title = isUnread ? labels.markAsReadTitle : labels.markAsUnreadTitle;
  const aria = isUnread ? labels.markAsRead : labels.markAsUnread;
  const Icon = isUnread ? MailOpen : Mail;

  async function onToggle() {
    if (busy) return;
    setBusy(true);
    const res = await setAdminPortalMessageReadState(locale, messageId, !isUnread);
    setBusy(false);
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onToggle()}
      title={title}
      aria-label={aria}
      aria-busy={busy || undefined}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60 sm:min-h-9 sm:w-auto sm:min-w-9 sm:rounded-[var(--layout-border-radius)] sm:px-2"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate sm:hidden">{aria}</span>
    </button>
  );
}
