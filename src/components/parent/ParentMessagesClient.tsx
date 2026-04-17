"use client";

import { ParentMessagesFeed, type ParentMessageLineDto } from "@/components/parent/ParentMessagesFeed";
import { ParentPortalCompose } from "@/components/parent/ParentPortalCompose";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

export type { ParentMessageLineDto };

interface ParentMessagesClientProps {
  locale: string;
  initialLines?: ParentMessageLineDto[];
  recipients: MessagingRecipient[];
  canCompose: boolean;
  labels: Dictionary["dashboard"]["parent"];
  defaultRecipientId?: string;
}

export function ParentMessagesClient({
  locale,
  initialLines = [],
  recipients,
  canCompose,
  labels,
  defaultRecipientId,
}: ParentMessagesClientProps) {
  return (
    <div className="space-y-8">
      {!canCompose ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesNoTeachers}</p>
      ) : (
        <ParentPortalCompose
          locale={locale}
          recipients={recipients}
          labels={labels}
          defaultRecipientId={defaultRecipientId}
        />
      )}
      <ParentMessagesFeed rows={initialLines} labels={labels} />
    </div>
  );
}
