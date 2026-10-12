"use client";

import { Archive, ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EventFormQuestionOrderItem } from "@/lib/events/buildEventFormQuestionItems";

export type { EventFormQuestionOrderItem };

interface QuestionOrderLabels {
  dragHandle: string;
  moveUp: string;
  moveDown: string;
  edit: string;
  archive: string;
  removeAsDelete: boolean;
  requiredLabel: string;
}

function fillLabel(template: string, label: string): string {
  return template.replace("{{label}}", label);
}

export function EventFormQuestionOrderRow({
  item,
  index,
  total,
  pending,
  labels,
  onMove,
  onEdit,
  onArchive,
}: {
  item: EventFormQuestionOrderItem;
  index: number;
  total: number;
  pending: boolean;
  labels: QuestionOrderLabels;
  onMove: (index: number, delta: -1 | 1) => void;
  onEdit: (fieldId: string) => void;
  onArchive: (fieldId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.token,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm ${isDragging ? "ring-2 ring-[var(--color-primary)]" : ""}`}
    >
      <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-[36px] min-w-[36px] cursor-grab items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] active:cursor-grabbing"
          aria-label={fillLabel(labels.dragHandle, item.label)}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <span className="font-medium text-[var(--color-foreground)]">
          {item.label}
          {item.note ? (
            <span className="mt-0.5 block text-xs font-normal text-[var(--color-muted-foreground)]">{item.note}</span>
          ) : null}
        </span>
        {item.extra ? (
          <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {item.extra.typeLabel}
          </span>
        ) : null}
        {item.extra?.optionCountLabel ? (
          <span className="text-xs text-[var(--color-muted-foreground)]">{item.extra.optionCountLabel}</span>
        ) : null}
        {item.badge ? (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {item.badge}
          </span>
        ) : null}
      </span>
      <span className="inline-flex shrink-0 flex-wrap items-center gap-2">
        {item.requirement ? (
          <label className="inline-flex min-h-[36px] items-center gap-2 text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={item.requirement.checked}
              disabled={pending || item.requirement.disabled}
              onChange={(event) => item.requirement?.onChange(event.currentTarget.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            {labels.requiredLabel}
          </label>
        ) : null}
        <button
          type="button"
          aria-label={fillLabel(labels.moveUp, item.label)}
          disabled={pending || index === 0}
          onClick={() => onMove(index, -1)}
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] hover:bg-[var(--color-muted)] disabled:opacity-50"
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={fillLabel(labels.moveDown, item.label)}
          disabled={pending || index === total - 1}
          onClick={() => onMove(index, 1)}
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] hover:bg-[var(--color-muted)] disabled:opacity-50"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
        {item.extra ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => onEdit(item.extra?.id ?? "")}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {labels.edit}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onArchive(item.extra?.id ?? "")}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 disabled:opacity-50"
            >
              {labels.removeAsDelete ? (
                <Trash2 className="h-4 w-4" aria-hidden />
              ) : (
                <Archive className="h-4 w-4" aria-hidden />
              )}
              {labels.archive}
            </button>
          </>
        ) : null}
      </span>
    </li>
  );
}
