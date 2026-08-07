"use client";

import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { ParentFeedbackCopy } from "@/lib/parent/formatParentFeedbackLabels";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { ParentFeedbackTimelineDesktop } from "@/components/desktop/organisms/ParentFeedbackTimelineDesktop";
import { ParentFeedbackPwaList } from "@/components/pwa/organisms/ParentFeedbackPwaList";

export interface ParentFeedbackSurfaceProps {
  locale: string;
  timeline: ParentFeedbackTimeline;
  copy: ParentFeedbackCopy;
}

function FeedbackSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-5 w-40 animate-pulse rounded bg-[var(--color-muted)]" />
      <div className="h-24 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
      <div className="h-24 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
    </div>
  );
}

/** Tier A switch between the pointer-first timeline and the touch-first list. */
export function ParentFeedbackSurface({ locale, timeline, copy }: ParentFeedbackSurfaceProps) {
  return (
    <SurfaceMountGate
      skeleton={<FeedbackSkeleton />}
      desktop={<ParentFeedbackTimelineDesktop locale={locale} timeline={timeline} copy={copy} />}
      narrow={() => <ParentFeedbackPwaList locale={locale} timeline={timeline} copy={copy} />}
    />
  );
}
