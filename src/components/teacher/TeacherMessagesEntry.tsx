"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import {
  TeacherMessagesClient,
  type TeacherFeedRow,
} from "@/components/teacher/TeacherMessagesClient";
import type { MessagingRecipient } from "@/components/teacher/TeacherPortalCompose";
import type { Dictionary } from "@/types/i18n";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

type TeacherLabels = Dictionary["dashboard"]["teacher"];

function TeacherMessagesSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface TeacherMessagesEntryProps {
  locale: string;
  title: string;
  lead: string;
  feedRows: TeacherFeedRow[];
  recipients: MessagingRecipient[];
  labels: TeacherLabels;
}

export function TeacherMessagesEntry({
  locale,
  title,
  lead,
  feedRows,
  recipients,
  labels,
}: TeacherMessagesEntryProps) {
  const clientProps = { locale, feedRows, recipients, labels };

  return (
    <SurfaceMountGate
      skeleton={<TeacherMessagesSkeleton />}
      desktop={
        <div>
          <AdminPageHeader title={title} lead={lead} iconId="messages" artFamily="teachers" />
          <TeacherMessagesClient {...clientProps} />
        </div>
      }
      narrow={() => (
        <TeacherMessagesClient {...clientProps} layout="thread" />
      )}
    />
  );
}
