"use client";

import { useId, useState } from "react";
import { CalendarSync, Palette, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { PortalCalendarSpecialLegend } from "@/components/molecules/PortalCalendarSpecialLegend";
import { PortalCalendarSyncBlock } from "@/components/organisms/PortalCalendarSyncBlock";
import type { Dictionary } from "@/types/i18n";

type PortalCalDict = Dictionary["dashboard"]["portalCalendar"];

function CalendarVisualLegend({ dict }: { dict: PortalCalDict }) {
  const s = dict.schedule;
  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-3">
      <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">{s.visualLegendTitle}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-muted-foreground)]">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-success)]" aria-hidden />
          {s.visualLegendInPerson}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden />
          {s.visualLegendVirtual}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-warning)]" aria-hidden />
          {s.visualLegendToday}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-muted-foreground)]" aria-hidden />
          {s.visualLegendPast}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-error)]" aria-hidden />
          {s.visualLegendExam}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
          {s.visualLegendSpecial}
        </li>
      </ul>
    </div>
  );
}

function CalendarColorReferenceBody({ dict }: { dict: PortalCalDict }) {
  return (
    <div className="space-y-4 text-sm text-[var(--color-muted-foreground)]">
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded-sm bg-[var(--color-primary)]/40" aria-hidden />
          {dict.legend.class}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded-sm bg-[var(--color-error)]/50" aria-hidden />
          {dict.legend.exam}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded-sm bg-[var(--color-accent)]/60" aria-hidden />
          {dict.legend.special}
        </span>
      </div>
      <PortalCalendarSpecialLegend title={dict.specialLegendTitle} types={dict.specialTypes} />
      <CalendarVisualLegend dict={dict} />
    </div>
  );
}

export interface PortalCalendarAssistPanelProps {
  dict: PortalCalDict;
  feedUrl: string | null;
}

export function PortalCalendarAssistPanel({ dict, feedUrl }: PortalCalendarAssistPanelProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const colorTitleId = useId();
  const syncTitleId = useId();
  const s = dict.schedule;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setColorOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={colorOpen}
      >
        <Palette className="h-4 w-4 shrink-0 text-[var(--color-secondary-foreground)]" aria-hidden />
        {s.colorReferenceButton}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setSyncOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={syncOpen}
      >
        <CalendarSync className="h-4 w-4 shrink-0 text-[var(--color-secondary-foreground)]" aria-hidden />
        {s.syncDialogButton}
      </Button>

      <Modal
        open={colorOpen}
        onOpenChange={setColorOpen}
        titleId={colorTitleId}
        title={s.colorReferenceTitle}
        dialogClassName="max-w-lg"
      >
        <CalendarColorReferenceBody dict={dict} />
        <div className="pt-2">
          <Button type="button" variant="secondary" onClick={() => setColorOpen(false)}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {s.dialogClose}
          </Button>
        </div>
      </Modal>

      <Modal
        open={syncOpen}
        onOpenChange={setSyncOpen}
        titleId={syncTitleId}
        title={dict.sync.title}
        dialogClassName="max-w-2xl"
      >
        <PortalCalendarSyncBlock dict={dict.sync} initialFeedUrl={feedUrl} embedded />
        <div className="pt-2">
          <Button type="button" variant="secondary" onClick={() => setSyncOpen(false)}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {s.dialogClose}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
