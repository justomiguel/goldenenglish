"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EventFormQuestionOrderRow } from "@/components/dashboard/admin/events/EventFormQuestionOrderRow";
import type { EventFormQuestionOrderItem } from "@/lib/events/buildEventFormQuestionItems";

interface EventFormDroppableFieldsProps {
  containerId: string;
  items: EventFormQuestionOrderItem[];
  pending: boolean;
  emptyLabel?: string;
  labels: {
    dragHandle: string;
    moveUp: string;
    moveDown: string;
    edit: string;
    archive: string;
    removeAsDelete: boolean;
    requiredLabel: string;
  };
  onMove: (index: number, delta: -1 | 1) => void;
  onEdit: (fieldId: string) => void;
  onArchive: (fieldId: string) => void;
}

export function EventFormDroppableFields({
  containerId,
  items,
  pending,
  emptyLabel,
  labels,
  onMove,
  onEdit,
  onArchive,
}: EventFormDroppableFieldsProps) {
  const { setNodeRef, isOver } = useDroppable({ id: containerId });

  return (
    <SortableContext items={items.map((item) => item.token)} strategy={verticalListSortingStrategy}>
      <ul
        ref={setNodeRef}
        className={`min-h-[44px] space-y-2 rounded-md ${isOver ? "ring-2 ring-[var(--color-primary)]" : ""}`}
      >
        {items.map((item, index) => (
          <EventFormQuestionOrderRow
            key={item.token}
            item={item}
            index={index}
            total={items.length}
            pending={pending}
            labels={labels}
            onMove={onMove}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        ))}
        {items.length === 0 && emptyLabel ? (
          <li className="px-2 py-3 text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</li>
        ) : null}
      </ul>
    </SortableContext>
  );
}
