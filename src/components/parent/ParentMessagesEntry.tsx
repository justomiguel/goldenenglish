"use client";

import {
  ParentMessagesClient,
  type ParentMessageLineDto,
} from "@/components/parent/ParentMessagesClient";
import { ParentRouteSurfaceGate } from "@/components/parent/ParentRouteSurfaceGate";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

type ParentLabels = Dictionary["dashboard"]["parent"];

export type { ParentMessageLineDto };

export interface ParentMessagesEntryProps {
  locale: string;
  title: string;
  lead: string;
  lines: ParentMessageLineDto[];
  recipients: MessagingRecipient[];
  canCompose: boolean;
  labels: ParentLabels;
  defaultRecipientId?: string;
}

export function ParentMessagesEntry({
  locale,
  title,
  lead,
  lines,
  recipients,
  canCompose,
  labels,
  defaultRecipientId,
}: ParentMessagesEntryProps) {
  return (
    <ParentRouteSurfaceGate>
      <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)] sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <ParentMessagesClient
        locale={locale}
        initialLines={lines}
        recipients={recipients}
        canCompose={canCompose}
        labels={labels}
        defaultRecipientId={defaultRecipientId}
      />
    </ParentRouteSurfaceGate>
  );
}
