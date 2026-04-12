"use client";

import { TeacherPortalCompose } from "@/components/teacher/TeacherPortalCompose";
import {
  TeacherMessagesFeed,
  type TeacherFeedRow,
} from "@/components/teacher/TeacherMessagesFeed";
import type { MessagingRecipient } from "@/components/teacher/TeacherPortalCompose";
import type { Dictionary } from "@/types/i18n";

export type { TeacherFeedRow };

interface TeacherMessagesClientProps {
  locale: string;
  feedRows?: TeacherFeedRow[];
  recipients?: MessagingRecipient[];
  labels: Dictionary["dashboard"]["teacher"];
}

export function TeacherMessagesClient({
  locale,
  feedRows = [],
  recipients = [],
  labels,
}: TeacherMessagesClientProps) {
  return (
    <div className="space-y-8">
      <TeacherPortalCompose locale={locale} recipients={recipients} labels={labels} />
      <TeacherMessagesFeed locale={locale} rows={feedRows} labels={labels} />
    </div>
  );
}
