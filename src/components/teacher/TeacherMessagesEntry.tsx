"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import {
  TeacherMessagesClient,
  type TeacherFeedRow,
} from "@/components/teacher/TeacherMessagesClient";
import type { MessagingRecipient } from "@/components/teacher/TeacherPortalCompose";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";

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
  const body = (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>
      <TeacherMessagesClient
        locale={locale}
        feedRows={feedRows}
        recipients={recipients}
        labels={labels}
      />
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<TeacherMessagesSkeleton />}
      desktop={<div>{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
