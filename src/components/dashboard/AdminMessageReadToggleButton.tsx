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
      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}
