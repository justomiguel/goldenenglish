"use client";

import { useState, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EventFormQuestionOrderRow } from "@/components/dashboard/admin/events/EventFormQuestionOrderRow";
import { EventFormDroppableFields } from "@/components/dashboard/admin/events/EventFormDroppableFields";
import { useEventFormFieldBoard } from "@/components/dashboard/admin/events/eventFormFieldBoardContext";
import type { EventFormQuestionOrderItem } from "@/lib/events/buildEventFormQuestionItems";
import { SHARED_FIELD_CONTAINER } from "@/lib/events/placeRegistrationField";

export type { EventFormQuestionOrderItem };

interface EventFormQuestionOrderListProps {
  title: string;
  lead: string;
  items: EventFormQuestionOrderItem[];
  pending: boolean;
  error: string | null;
  labels: {
    dragHandle: string;
    moveUp: string;
    moveDown: string;
    edit: string;
    archive: string;
    removeAsDelete: boolean;
    requiredLabel: string;
    customFieldsEmpty: string;
  };
  onReorder: (tokens: string[]) => void;
  onEdit: (fieldId: string) => void;
  onArchive: (fieldId: string) => void;
  children?: ReactNode;
}

export function EventFormQuestionOrderList({
  title,
  lead,
  items,
  pending,
  error,
  labels,
  onReorder,
  onEdit,
  onArchive,
  children,
}: EventFormQuestionOrderListProps) {
  const board = useEventFormFieldBoard();
  const serverKey = items.map((item) => item.token).join("|");
  const [seenKey, setSeenKey] = useState(serverKey);
  const [tokens, setTokens] = useState(items.map((item) => item.token));
  if (seenKey !== serverKey) {
    setSeenKey(serverKey);
    setTokens(items.map((item) => item.token));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ordered = tokens
    .map((token) => items.find((item) => item.token === token))
    .filter((item): item is EventFormQuestionOrderItem => Boolean(item));
  const hasExtras = ordered.some((item) => item.extra);

  function commit(next: string[]) {
    setTokens(next);
    onReorder(next);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tokens.indexOf(String(active.id));
    const newIndex = tokens.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    commit(arrayMove(tokens, oldIndex, newIndex));
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= tokens.length) return;
    commit(arrayMove(tokens, index, target));
  }

  const rowLabels = {
    dragHandle: labels.dragHandle,
    moveUp: labels.moveUp,
    moveDown: labels.moveDown,
    edit: labels.edit,
    archive: labels.archive,
    removeAsDelete: labels.removeAsDelete,
    requiredLabel: labels.requiredLabel,
  };

  if (board) {
    const shared = (board.containers[SHARED_FIELD_CONTAINER] ?? [])
      .map((token) => board.itemByToken[token])
      .filter((item): item is EventFormQuestionOrderItem => Boolean(item));
    return (
      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
        </div>
        <EventFormDroppableFields
          containerId={SHARED_FIELD_CONTAINER}
          items={shared}
          pending={pending}
          labels={rowLabels}
          onMove={(index, delta) => board.moveWithin(SHARED_FIELD_CONTAINER, index, delta)}
          onEdit={onEdit}
          onArchive={onArchive}
        />
        {shared.some((item) => item.extra) ? null : (
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.customFieldsEmpty}</p>
        )}
        {children}
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ordered.map((item) => item.token)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {ordered.map((item, index) => (
              <EventFormQuestionOrderRow
                key={item.token}
                item={item}
                index={index}
                total={ordered.length}
                pending={pending}
                labels={labels}
                onMove={move}
                onEdit={onEdit}
                onArchive={onArchive}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {hasExtras ? null : (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.customFieldsEmpty}</p>
      )}
      {children}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </section>
  );
}
