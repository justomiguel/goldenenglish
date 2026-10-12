"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  assignEventFormFieldFlowAction,
  updateEventRegistrationFlowFieldOrderAction,
} from "@/app/[locale]/dashboard/admin/events/eventRegistrationFlowActions";
import { updateEventRegistrationFieldOrderAction } from "@/app/[locale]/dashboard/admin/events/eventRegistrationFieldActions";
import { EventFormFieldBoardContext } from "@/components/dashboard/admin/events/eventFormFieldBoardContext";
import type { EventFormQuestionOrderItem } from "@/lib/events/buildEventFormQuestionItems";
import {
  SHARED_FIELD_CONTAINER,
  containerOf,
  flowFieldContainerId,
  flowIdFromFieldContainer,
  placeRegistrationField,
} from "@/lib/events/placeRegistrationField";

const collision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length === 0) return closestCenter(args);
  const hit = new Set(pointer.map((entry) => entry.id));
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((entry) => hit.has(entry.id)),
  });
};

interface EventFormFieldBoardProps {
  locale: string;
  eventId: string;
  sharedItems: EventFormQuestionOrderItem[];
  flowItems: Record<string, EventFormQuestionOrderItem[]>;
  errorSave: string;
  children: ReactNode;
}

function sameList(left: string[] | undefined, right: string[] | undefined): boolean {
  return (left ?? []).join("|") === (right ?? []).join("|");
}

export function EventFormFieldBoard({
  locale,
  eventId,
  sharedItems,
  flowItems,
  errorSave,
  children,
}: EventFormFieldBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const itemByToken: Record<string, EventFormQuestionOrderItem> = {};
  for (const item of [...sharedItems, ...Object.values(flowItems).flat()]) {
    itemByToken[item.token] = item;
  }
  const serverKey = [
    sharedItems.map((item) => item.token).join("|"),
    ...Object.keys(flowItems)
      .toSorted()
      .map((flowId) => `${flowId}:${flowItems[flowId]?.map((item) => item.token).join(",") ?? ""}`),
  ].join(";");
  const [seenKey, setSeenKey] = useState(serverKey);
  const [containers, setContainers] = useState(() => buildContainers(sharedItems, flowItems));
  if (seenKey !== serverKey) {
    setSeenKey(serverKey);
    setContainers(buildContainers(sharedItems, flowItems));
  }
  const containersRef = useRef(containers);
  useEffect(() => {
    containersRef.current = containers;
  }, [containers]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function persist(before: Record<string, string[]>, after: Record<string, string[]>, activeId: string) {
    const from = containerOf(before, activeId);
    const to = containerOf(after, activeId);
    startTransition(async () => {
      if (from && to && from !== to && activeId.startsWith("field:")) {
        const assigned = await assignEventFormFieldFlowAction({
          locale,
          eventId,
          fieldId: activeId.slice("field:".length),
          flowId: flowIdFromFieldContainer(to),
        });
        if (!assigned.ok) {
          setContainers(before);
          setError(errorSave);
          return;
        }
      }
      if (!sameList(before[SHARED_FIELD_CONTAINER], after[SHARED_FIELD_CONTAINER])) {
        const saved = await updateEventRegistrationFieldOrderAction({
          locale,
          eventId,
          order: after[SHARED_FIELD_CONTAINER] ?? [],
        });
        if (!saved.ok) {
          setError(errorSave);
          return;
        }
      }
      for (const [containerId, tokens] of Object.entries(after)) {
        const flowId = flowIdFromFieldContainer(containerId);
        if (!flowId || sameList(before[containerId], tokens)) continue;
        const saved = await updateEventRegistrationFlowFieldOrderAction({
          locale,
          eventId,
          flowId,
          order: tokens.filter((token) => token.startsWith("field:")),
        });
        if (!saved.ok) {
          setError(errorSave);
          return;
        }
      }
      setError(null);
      router.refresh();
    });
  }

  function commit(next: Record<string, string[]>, activeId: string) {
    const before = containersRef.current;
    setContainers(next);
    persist(before, next, activeId);
  }

  function onDragEnd(event: DragEndEvent) {
    const overId = event.over?.id;
    if (!overId) return;
    const next = placeRegistrationField({
      containers: containersRef.current,
      activeId: String(event.active.id),
      overId: String(overId),
    });
    if (!next) return;
    commit(next, String(event.active.id));
  }

  function moveWithin(containerId: string, index: number, delta: -1 | 1) {
    const items = containersRef.current[containerId] ?? [];
    const target = index + delta;
    const activeId = items[index];
    if (!activeId || target < 0 || target >= items.length) return;
    const overId = items[target];
    if (!overId) return;
    const next = placeRegistrationField({
      containers: containersRef.current,
      activeId,
      overId,
    });
    if (!next) return;
    commit(next, activeId);
  }

  return (
    <EventFormFieldBoardContext.Provider value={{ itemByToken, containers, moveWithin }}>
      <DndContext sensors={sensors} collisionDetection={collision} onDragEnd={onDragEnd}>
        {children}
      </DndContext>
      {error && !pending ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </EventFormFieldBoardContext.Provider>
  );
}

function buildContainers(
  sharedItems: EventFormQuestionOrderItem[],
  flowItems: Record<string, EventFormQuestionOrderItem[]>,
): Record<string, string[]> {
  return {
    [SHARED_FIELD_CONTAINER]: sharedItems.map((item) => item.token),
    ...Object.fromEntries(
      Object.entries(flowItems).map(([flowId, items]) => [
        flowFieldContainerId(flowId),
        items.map((item) => item.token),
      ]),
    ),
  };
}
