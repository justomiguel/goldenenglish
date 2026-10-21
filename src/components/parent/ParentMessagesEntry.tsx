"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import {
  ParentMessagesClient,
  type ParentMessageLineDto,
} from "@/components/parent/ParentMessagesClient";
import { ParentMessagesPwaClient } from "@/components/pwa/organisms/ParentMessagesPwaClient";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

type ParentLabels = Dictionary["dashboard"]["parent"];

export type { ParentMessageLineDto };

function ParentMessagesSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 max-w-xs rounded bg-[var(--color-muted)]" />
      <div className="h-24 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface ParentMessagesEntryProps {
  locale: string;
  title: string;
  lead: string;
  lines: ParentMessageLineDto[];
  recipients: MessagingRecipient[];
  teacherComposeAvailable: boolean;
  administrationComposeAvailable: boolean;
  labels: ParentLabels;
  defaultRecipientId?: string;
}

export function ParentMessagesEntry(props: ParentMessagesEntryProps) {
  const {
    locale,
    title,
    lead,
    lines,
    recipients,
    teacherComposeAvailable,
    administrationComposeAvailable,
    labels,
    defaultRecipientId,
  } = props;

  const desktop = (
    <div data-tour={PARENT_TOUR_ANCHORS.messagesFeed}>
      <h1
        data-tour={PARENT_TOUR_ANCHORS.messagesTitle}
        className="font-display text-2xl font-bold text-[var(--color-secondary)] sm:text-3xl"
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <div className="mt-6" data-tour={PARENT_TOUR_ANCHORS.messagesCompose}>
        <ParentMessagesClient
          locale={locale}
          initialLines={lines}
          recipients={recipients}
          teacherComposeAvailable={teacherComposeAvailable}
          administrationComposeAvailable={administrationComposeAvailable}
          labels={labels}
          defaultRecipientId={defaultRecipientId}
        />
      </div>
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<ParentMessagesSkeleton />}
      desktop={desktop}
      narrow={() => (
        <ParentMessagesPwaClient
          locale={locale}
          title={title}
          lead={lead}
          initialLines={lines}
          recipients={recipients}
          teacherComposeAvailable={teacherComposeAvailable}
          administrationComposeAvailable={administrationComposeAvailable}
          labels={labels}
          defaultRecipientId={defaultRecipientId}
        />
      )}
    />
  );
}
