"use client";

import { useState } from "react";
import { TeacherPortalCompose } from "@/components/teacher/TeacherPortalCompose";
import {
  TeacherMessagesFeed,
  type TeacherFeedRow,
} from "@/components/teacher/TeacherMessagesFeed";
import { TeacherThreadReplyForm } from "@/components/teacher/TeacherThreadReplyForm";
import type { MessagingRecipient } from "@/components/teacher/TeacherPortalCompose";
import type { Dictionary } from "@/types/i18n";

export type { TeacherFeedRow };

interface TeacherMessagesClientProps {
  locale: string;
  feedRows?: TeacherFeedRow[];
  recipients?: MessagingRecipient[];
  labels: Dictionary["dashboard"]["teacher"];
  /** Phone thread pins one composer. Wide screens keep the card form. */
  layout?: "cards" | "thread";
}

export function TeacherMessagesClient({
  locale,
  feedRows = [],
  recipients = [],
  labels,
  layout = "cards",
}: TeacherMessagesClientProps) {
  const [replyRow, setReplyRow] = useState<TeacherFeedRow | null>(null);
  const thread = layout === "thread";

  if (!thread) {
    return (
      <div className="space-y-8">
        <TeacherPortalCompose locale={locale} recipients={recipients} labels={labels} />
        <TeacherMessagesFeed locale={locale} rows={feedRows} labels={labels} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="min-h-0 flex-1 pb-3">
        <TeacherMessagesFeed
          locale={locale}
          rows={feedRows}
          labels={labels}
          layout="thread"
          onRequestReply={setReplyRow}
        />
      </div>
      <div className="sticky bottom-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))] z-20 border-t border-[var(--color-border)] bg-[var(--color-background)] pt-3">
        {replyRow ? (
          <TeacherThreadReplyForm
            locale={locale}
            row={replyRow}
            labels={labels}
            onCancel={() => setReplyRow(null)}
            onSent={() => setReplyRow(null)}
          />
        ) : (
          <TeacherPortalCompose
            locale={locale}
            recipients={recipients}
            labels={labels}
            showHeading={false}
            className="space-y-3 overflow-visible"
          />
        )}
      </div>
    </div>
  );
}
