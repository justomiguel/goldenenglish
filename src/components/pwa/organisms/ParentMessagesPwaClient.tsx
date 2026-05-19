"use client";

import { PenLine } from "lucide-react";
import { useId, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { PortalComposeExpandableFab } from "@/components/pwa/molecules/PortalComposeExpandableFab";
import { ParentMessagesComposeForm } from "@/components/parent/ParentMessagesComposeForm";
import {
  ParentMessagesFeed,
  type ParentMessageLineDto,
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

export function ParentMessagesPwaClient({
  locale,
  title,
  lead,
  initialLines = [],
  recipients,
  teacherComposeAvailable,
  administrationComposeAvailable,
  labels,
  defaultRecipientId,
}: ParentMessagesPwaClientProps) {
  const titleId = useId();
  const canComposeAny = teacherComposeAvailable || administrationComposeAvailable;
  const [composeOpen, setComposeOpen] = useState(
    () => Boolean(defaultRecipientId && teacherComposeAvailable),
  );

  return (
    <div className="space-y-4 pb-6">
      <header>
        <h1 className="font-display text-xl font-bold text-[var(--color-secondary)]">{title}</h1>
        <p className="mt-1 text-sm leading-snug text-[var(--color-muted-foreground)]">{lead}</p>
      </header>

      <ParentMessagesFeed rows={initialLines} labels={labels} />

      {canComposeAny ? (
        <PortalComposeExpandableFab
          label={labels.messagesWriteCta}
          Icon={PenLine}
          onClick={() => setComposeOpen(true)}
        />
      ) : null}

      <Modal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        titleId={titleId}
        title={labels.messagesComposeTitle}
        dialogClassName="sm:max-w-lg"
        stackClassName="z-[120]"
      >
        <div className="max-h-[min(70dvh,32rem)] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-1">
          <ParentMessagesComposeForm
            locale={locale}
            recipients={recipients}
            teacherComposeAvailable={teacherComposeAvailable}
            administrationComposeAvailable={administrationComposeAvailable}
            labels={labels}
            defaultRecipientId={defaultRecipientId}
            onSentSuccess={() => setComposeOpen(false)}
            showHeading={false}
            className="space-y-4"
          />
        </div>
      </Modal>
    </div>
  );
}
