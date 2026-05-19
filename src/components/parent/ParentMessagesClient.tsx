"use client";

import { ParentMessagesComposeForm } from "@/components/parent/ParentMessagesComposeForm";
import {
  ParentMessagesFeed,
  type ParentMessageLineDto,
} from "@/components/parent/ParentMessagesFeed";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

export type { ParentMessageLineDto };
export {
  PARENT_MESSAGE_DEST_ADMINISTRATION,
  PARENT_MESSAGE_DEST_TEACHER,
} from "@/components/parent/ParentMessagesComposeForm";

interface ParentMessagesClientProps {
  locale: string;
  initialLines?: ParentMessageLineDto[];
  recipients: MessagingRecipient[];
  teacherComposeAvailable: boolean;
  administrationComposeAvailable: boolean;
  labels: Dictionary["dashboard"]["parent"];
  defaultRecipientId?: string;
}

export function ParentMessagesClient({
  locale,
  initialLines = [],
  recipients,
  teacherComposeAvailable,
  administrationComposeAvailable,
  labels,
  defaultRecipientId,
}: ParentMessagesClientProps) {
  return (
    <div className="space-y-8">
      <ParentMessagesComposeForm
        locale={locale}
        recipients={recipients}
        teacherComposeAvailable={teacherComposeAvailable}
        administrationComposeAvailable={administrationComposeAvailable}
        labels={labels}
        defaultRecipientId={defaultRecipientId}
      />
      <ParentMessagesFeed rows={initialLines} labels={labels} />
    </div>
  );
}
