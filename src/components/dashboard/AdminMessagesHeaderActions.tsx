"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePenLine, PenLine } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminEditDefaultReplyModal } from "@/components/dashboard/AdminEditDefaultReplyModal";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { MessagingDefaultReplyTemplates } from "@/lib/messaging/messagingDefaultReplyConstants";
import type { Dictionary } from "@/types/i18n";

interface AdminMessagesHeaderActionsProps {
  locale: string;
  composeHref: string;
  initialTemplates: MessagingDefaultReplyTemplates;
  labels: Dictionary["admin"]["messages"];
}

export function AdminMessagesHeaderActions({
  locale,
  composeHref,
  initialTemplates,
  labels,
}: AdminMessagesHeaderActionsProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-[44px] rounded-xl border border-[var(--color-border)] px-4"
          title={labels.editDefaultMessageCtaTitle}
          onClick={() => setEditOpen(true)}
        >
          <FilePenLine className="h-4 w-4 shrink-0" aria-hidden />
          {labels.editDefaultMessageCta}
        </Button>
        <Link
          href={composeHref}
          data-tour={ADMIN_TOUR_ANCHORS.messagesComposeCta}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] shadow-sm transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          title={labels.writeMessageCtaTitle}
        >
          <PenLine className="h-4 w-4 shrink-0" aria-hidden />
          {labels.writeMessageCta}
        </Link>
      </div>
      <AdminEditDefaultReplyModal
        locale={locale}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialTemplates={initialTemplates}
        labels={labels}
      />
    </>
  );
}
