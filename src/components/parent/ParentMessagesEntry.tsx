"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import {
  ParentMessagesClient,
  type ParentMessageLineDto,
} from "@/components/parent/ParentMessagesClient";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { ParentMessagesPwaClient } from "@/components/pwa/organisms/ParentMessagesPwaClient";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

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
    <>
      <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)] sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <div className="mt-6">
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
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<ParentMessagesSkeleton />}
      desktop={desktop}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">
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
            </div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
