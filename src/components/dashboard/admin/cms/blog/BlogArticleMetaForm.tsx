"use client";

import { Hash, CalendarDays, Pin } from "lucide-react";

interface BlogArticleMetaFormProps {
  labels: {
    status: string;
    tagsCsv: string;
    scheduledFor: string;
    pinned: string;
  };
  status: string;
  tagsCsv: string;
  scheduledFor: string;
  isPinned: boolean;
  onStatusChange: (value: string) => void;
  onTagsCsvChange: (value: string) => void;
  onScheduledForChange: (value: string) => void;
  onPinnedChange: (value: boolean) => void;
}

export function BlogArticleMetaForm(props: BlogArticleMetaFormProps) {
  return (
    <div className="grid gap-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <label className="grid gap-1 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <Hash aria-hidden className="h-4 w-4" />
          {props.labels.status}
        </span>
        <select
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={props.status}
          onChange={(event) => props.onStatusChange(event.target.value)}
        >
          <option value="draft">draft</option>
          <option value="pending_review">pending_review</option>
          <option value="scheduled">scheduled</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <Hash aria-hidden className="h-4 w-4" />
          {props.labels.tagsCsv}
        </span>
        <input
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={props.tagsCsv}
          onChange={(event) => props.onTagsCsvChange(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <CalendarDays aria-hidden className="h-4 w-4" />
          {props.labels.scheduledFor}
        </span>
        <input
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          type="datetime-local"
          value={props.scheduledFor}
          onChange={(event) => props.onScheduledForChange(event.target.value)}
        />
      </label>

      <label className="inline-flex items-center gap-2 text-sm">
        <Pin aria-hidden className="h-4 w-4" />
        <input
          type="checkbox"
          checked={props.isPinned}
          onChange={(event) => props.onPinnedChange(event.target.checked)}
        />
        {props.labels.pinned}
      </label>
    </div>
  );
}
