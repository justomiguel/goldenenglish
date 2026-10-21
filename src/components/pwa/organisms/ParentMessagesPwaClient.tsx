"use client";

import { useState } from "react";
import { ParentMessageReplyForm } from "@/components/parent/ParentMessageReplyForm";
import { ParentMessagesComposeForm } from "@/components/parent/ParentMessagesComposeForm";
import {
  ParentMessagesFeed,
  type ParentMessageLineDto,
  type ParentReplyTarget,
} from "@/components/parent/ParentMessagesFeed";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

export interface ParentMessagesPwaClientProps {
  locale: string;
  title: string;
  lead: string;
  initialLines?: ParentMessageLineDto[];
  recipients: MessagingRecipient[];
  teacherComposeAvailable: boolean;
  administrationComposeAvailable: boolean;
  labels: Dictionary["dashboard"]["parent"];
  defaultRecipientId?: string;
}

const composerClass = "space-y-3";

export function ParentMessagesPwaClient({
  locale,
  title: _title,
  lead: _lead,
  initialLines = [],
  recipients,
  teacherComposeAvailable,
  administrationComposeAvailable,
  labels,
  defaultRecipientId,
}: ParentMessagesPwaClientProps) {
  void _title;
  void _lead;
  const canComposeAny = teacherComposeAvailable || administrationComposeAvailable;
  const [replyTarget, setReplyTarget] = useState<ParentReplyTarget | null>(null);

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="min-h-0 flex-1 pb-3">
        <ParentMessagesFeed
          rows={initialLines}
          labels={labels}
          layout="thread"
          onReply={setReplyTarget}
        />
      </div>

      <div className="sticky bottom-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))] z-20 border-t border-[var(--color-border)] bg-[var(--color-background)] px-1 pt-3">
        {replyTarget ? (
          <ParentMessageReplyForm
            locale={locale}
            target={replyTarget}
            labels={labels}
            onCancel={() => setReplyTarget(null)}
            onSentSuccess={() => setReplyTarget(null)}
            showHeading={false}
            className={composerClass}
          />
        ) : canComposeAny ? (
          <ParentMessagesComposeForm
            locale={locale}
            recipients={recipients}
            teacherComposeAvailable={teacherComposeAvailable}
            administrationComposeAvailable={administrationComposeAvailable}
            labels={labels}
            defaultRecipientId={defaultRecipientId}
            showHeading={false}
            className={composerClass}
          />
        ) : null}
      </div>
    </div>
  );
}
