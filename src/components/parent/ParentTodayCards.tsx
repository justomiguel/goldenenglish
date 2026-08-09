"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, RefreshCw, TriangleAlert } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  appendPushCard,
  type ParentTodayCard,
  type ParentTodayFeed,
} from "@/lib/parent/buildParentTodayFeed";
import { subscribeToPush } from "@/lib/push/subscribePushClient";

type TodayCopy = Dictionary["dashboard"]["parent"]["today"];

export interface ParentTodayCardsProps {
  feed: ParentTodayFeed;
  copy: TodayCopy;
}

const TONE_CLASS: Record<ParentTodayCard["tone"], string> = {
  urgent: "border-[var(--color-error)]/40 bg-[var(--color-error)]/5",
  attention: "border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5",
  info: "border-[var(--color-border)] bg-[var(--color-surface)]",
};

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function titleFor(card: ParentTodayCard, copy: TodayCopy): string {
  const many = String(card.count);
  const detail = card.detail ?? "";
  switch (card.kind) {
    case "paymentOverdue":
      return card.count > 1
        ? fill(copy.paymentOverdueTitleMany, { count: many })
        : copy.paymentOverdueTitle;
    case "unreadMessages":
      return card.count > 1
        ? fill(copy.unreadMessagesTitleMany, { count: many })
        : copy.unreadMessagesTitle;
    case "taskDueSoon":
      return card.detail
        ? fill(copy.taskDueSoonTitle, { detail })
        : fill(copy.taskDueSoonTitleMany, { count: many });
    case "absence":
      return card.detail
        ? fill(copy.absenceTitle, { detail })
        : fill(copy.absenceTitleMany, { count: many });
    case "paymentPending":
      return copy.paymentPendingTitle;
    case "enablePush":
      return copy.enablePushTitle;
  }
}

function ctaFor(card: ParentTodayCard, copy: TodayCopy): string {
  switch (card.kind) {
    case "paymentOverdue":
      return copy.paymentOverdueCta;
    case "unreadMessages":
      return copy.unreadMessagesCta;
    case "taskDueSoon":
      return copy.taskDueSoonCta;
    case "absence":
      return copy.absenceCta;
    case "paymentPending":
      return copy.paymentPendingCta;
    case "enablePush":
      return copy.enablePushCta;
  }
}

function sourceLabel(source: string, copy: TodayCopy): string {
  if (source === "payments") return copy.sourcePayments;
  if (source === "messages") return copy.sourceMessages;
  if (source === "tasks") return copy.sourceTasks;
  if (source === "attendance") return copy.sourceAttendance;
  return source;
}

/** Notification permission is browser state, so it is read after hydration, not on the server. */
function subscribePermission(onChange: () => void) {
  queueMicrotask(onChange);
  return () => {};
}

function readPermission(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "default";
}

export function ParentTodayCards({ feed, copy }: ParentTodayCardsProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(false);
  const [pushError, setPushError] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const browserWantsPush = useSyncExternalStore(
    subscribePermission,
    readPermission,
    useCallback(() => false, []),
  );
  const pushEligible = browserWantsPush && !pushDismissed;

  const resolved = useMemo(
    () => (pushEligible ? appendPushCard(feed) : feed),
    [feed, pushEligible],
  );

  async function enablePush() {
    setPushBusy(true);
    const result = await subscribeToPush();
    setPushBusy(false);
    if (result.ok) {
      setPushDismissed(true);
      return;
    }
    setPushError(true);
  }

  const cards = expanded ? resolved.cards : resolved.visible;
  const nothingToShow = resolved.cards.length === 0 && resolved.failures.length === 0;

  return (
    <div className="space-y-3">
      {resolved.failures.map((source) => (
        <div
          key={source}
          role="status"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
            {fill(copy.failureTitle, { source: sourceLabel(source, copy) })}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{copy.failureBody}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {copy.failureRetry}
          </button>
        </div>
      ))}

      {nothingToShow ? (
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center">
          <p className="font-display text-base font-semibold text-[var(--color-foreground)]">
            {copy.allClearTitle}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{copy.allClearBody}</p>
        </div>
      ) : null}

      {cards.map((card) => {
        const title = titleFor(card, copy);
        const cta = ctaFor(card, copy);
        const className = `flex items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border px-4 py-3 ${TONE_CLASS[card.tone]}`;

        if (card.kind === "enablePush") {
          return (
            <div key={card.kind} className={className}>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
                  <Bell className="h-4 w-4 shrink-0" aria-hidden />
                  {title}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                  {pushError ? copy.enablePushDenied : copy.enablePushBody}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void enablePush()}
                disabled={pushBusy}
                className="shrink-0 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-foreground)] disabled:opacity-60"
              >
                {cta}
              </button>
            </div>
          );
        }

        return (
          <Link key={card.kind} href={card.href ?? "#"} className={className}>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--color-foreground)]">
                {title}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-[var(--color-primary)]">
                {cta}
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
              aria-hidden
            />
          </Link>
        );
      })}

      {resolved.hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="min-h-[40px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted-foreground)]"
        >
          {expanded ? copy.seeLess : copy.seeAll}
        </button>
      ) : null}
    </div>
  );
}
