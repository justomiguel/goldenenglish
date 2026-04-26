"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import {
  ensureCalendarFeedTokenAction,
  rotateCalendarFeedTokenAction,
} from "@/app/[locale]/dashboard/calendar/calendarFeedActions";

type SyncDict = {
  title: string;
  lead: string;
  button: string;
  urlLabel: string;
  google: string;
  outlook: string;
  errorAuth: string;
  errorSave: string;
  rotateButton: string;
  rotateHint: string;
  rotateConfirm: string;
};

export interface PortalCalendarSyncBlockProps {
  dict: SyncDict;
  initialFeedUrl: string | null;
  /** When true (e.g. inside a dialog), omit outer card chrome and heading — parent supplies title. */
  embedded?: boolean;
}

export function PortalCalendarSyncBlock({ dict, initialFeedUrl, embedded }: PortalCalendarSyncBlockProps) {
  const router = useRouter();
  const [feedUrl, setFeedUrl] = useState(initialFeedUrl);
  const [err, setErr] = useState<string | null>(null);
  const [rotateErr, setRotateErr] = useState<string | null>(null);
  const [syncPending, startSync] = useTransition();
  const [rotatePending, startRotate] = useTransition();

  const sync = () => {
    setErr(null);
    startSync(async () => {
      const r = await ensureCalendarFeedTokenAction();
      if (!r.ok) {
        setErr(r.code === "AUTH" ? dict.errorAuth : dict.errorSave);
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setFeedUrl(`${origin}/api/calendar/feed/${r.token}.ics`);
      router.refresh();
    });
  };

  const rotate = () => {
    if (!feedUrl) return;
    if (typeof window !== "undefined" && !window.confirm(dict.rotateConfirm)) return;
    setRotateErr(null);
    startRotate(async () => {
      const r = await rotateCalendarFeedTokenAction();
      if (!r.ok) {
        setRotateErr(r.code === "AUTH" ? dict.errorAuth : dict.errorSave);
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setFeedUrl(`${origin}/api/calendar/feed/${r.token}.ics`);
      router.refresh();
    });
  };

  const inner = (
    <>
      {!embedded ? (
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      ) : null}
      <p className={embedded ? "text-xs text-[var(--color-muted-foreground)]" : "mt-1 text-xs text-[var(--color-muted-foreground)]"}>
        {dict.lead}
      </p>
      <Button type="button" className="mt-3" onClick={sync} isLoading={syncPending} disabled={syncPending}>
        {dict.button}
      </Button>
      {err ? (
        <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">
          {err}
        </p>
      ) : null}
      {feedUrl ? (
        <div className="mt-4 space-y-3 text-sm text-[var(--color-foreground)]">
          <div>
            <p className="font-medium text-[var(--color-primary)]">{dict.urlLabel}</p>
            <p className="mt-1 break-all rounded border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2 font-mono text-xs">
              {feedUrl}
            </p>
          </div>
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)]/60 p-3">
            <p className="text-xs text-[var(--color-muted-foreground)]">{dict.rotateHint}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={rotate}
              isLoading={rotatePending}
              disabled={rotatePending || syncPending}
            >
              {dict.rotateButton}
            </Button>
            {rotateErr ? (
              <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">
                {rotateErr}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 text-[var(--color-muted-foreground)]">
            <p>
              <span className="font-semibold text-[var(--color-foreground)]">Google Calendar</span> — {dict.google}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-foreground)]">Outlook</span> — {dict.outlook}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-2">{inner}</div>;
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {inner}
    </section>
  );
}
