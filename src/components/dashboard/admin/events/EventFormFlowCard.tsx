"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, ChevronUp, Plus, Save, X } from "lucide-react";
import {
  archiveEventRegistrationFlowAction,
  saveEventRegistrationFlowAction,
  updateEventRegistrationFlowFieldOrderAction,
} from "@/app/[locale]/dashboard/admin/events/eventRegistrationFlowActions";
import { Button } from "@/components/atoms/Button";
import { EventFormFieldAddPanel } from "@/components/dashboard/admin/events/EventFormFieldAddPanel";
import { EventFormDroppableFields } from "@/components/dashboard/admin/events/EventFormDroppableFields";
import { useEventFormFieldBoard } from "@/components/dashboard/admin/events/eventFormFieldBoardContext";
import type { EventFormQuestionOrderItem } from "@/lib/events/buildEventFormQuestionItems";
import { flowFieldContainerId } from "@/lib/events/placeRegistrationField";

interface FlowField {
  id: string;
  label: string;
  flowId: string | null;
}

interface EventFormFlowCardProps {
  locale: string;
  eventId: string;
  priceByFlow: boolean;
  nextPosition: number;
  flow: { id: string; name: string; price: number | null; fieldOrder: string[] };
  fields: FlowField[];
  labels: {
    nameLabel: string;
    priceLabel: string;
    save: string;
    archive: string;
    moveUp: string;
    moveDown: string;
    addField: string;
    cancel: string;
    errorSave: string;
    dropHint: string;
  };
  rowLabels: {
    dragHandle: string;
    moveUp: string;
    moveDown: string;
    edit: string;
    archive: string;
    removeAsDelete: boolean;
    requiredLabel: string;
  };
  onEdit: (fieldId: string) => void;
  onArchive: (fieldId: string) => void;
  addFieldLabels: ComponentProps<typeof EventFormFieldAddPanel>["labels"];
}

function orderedFields(
  flow: EventFormFlowCardProps["flow"],
  fields: FlowField[],
): FlowField[] {
  const owned = fields.filter((field) => field.flowId === flow.id);
  const placed = flow.fieldOrder.flatMap((token) => {
    const field = owned.find((item) => `field:${item.id}` === token);
    return field ? [field] : [];
  });
  const rest = owned.filter((field) => !placed.some((item) => item.id === field.id));
  return [...placed, ...rest];
}

export function EventFormFlowCard({
  locale,
  eventId,
  priceByFlow,
  nextPosition,
  flow,
  fields,
  labels,
  rowLabels,
  onEdit,
  onArchive,
  addFieldLabels,
}: EventFormFlowCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(flow.name);
  const [price, setPrice] = useState(flow.price == null ? "" : String(flow.price));
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = orderedFields(flow, fields);
  const board = useEventFormFieldBoard();
  const containerId = flowFieldContainerId(flow.id);
  const dropped = board
    ? (board.containers[containerId] ?? [])
        .map((token) => board.itemByToken[token])
        .filter((item): item is EventFormQuestionOrderItem => Boolean(item))
    : null;

  function save() {
    const amount = priceByFlow ? Number(price) : null;
    if (!name.trim() || (priceByFlow && !Number.isFinite(amount))) {
      setError(labels.errorSave);
      return;
    }
    startTransition(async () => {
      const result = await saveEventRegistrationFlowAction({
        locale,
        eventId,
        flowId: flow.id,
        name: name.trim(),
        price: amount,
      });
      setError(result.ok ? null : labels.errorSave);
      if (result.ok) router.refresh();
    });
  }

  function move(fieldId: string, direction: -1 | 1) {
    const index = rows.findIndex((field) => field.id === fieldId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const next = rows.slice();
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    startTransition(async () => {
      const result = await updateEventRegistrationFlowFieldOrderAction({
        locale,
        eventId,
        flowId: flow.id,
        order: next.map((field) => `field:${field.id}`),
      });
      if (result.ok) router.refresh();
      else setError(labels.errorSave);
    });
  }

  function archive() {
    startTransition(async () => {
      const result = await archiveEventRegistrationFlowAction({ locale, eventId, flowId: flow.id });
      if (result.ok) router.refresh();
      else setError(labels.errorSave);
    });
  }

  return (
    <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-40 flex-1 text-sm text-[var(--color-foreground)]">
          {labels.nameLabel}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
          />
        </label>
        {priceByFlow ? (
          <label className="w-28 text-sm text-[var(--color-foreground)]">
            {labels.priceLabel}
            <input
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
            />
          </label>
        ) : null}
        <Button type="button" onClick={save} disabled={pending} className="min-h-[36px]">
          <Save className="h-4 w-4 shrink-0" aria-hidden />
          {labels.save}
        </Button>
        <Button type="button" variant="ghost" onClick={archive} disabled={pending} className="min-h-[36px]">
          <Archive className="h-4 w-4 shrink-0" aria-hidden />
          {labels.archive}
        </Button>
      </div>
      {dropped ? (
        <EventFormDroppableFields
          containerId={containerId}
          items={dropped}
          pending={pending}
          emptyLabel={labels.dropHint}
          labels={rowLabels}
          onMove={(index, delta) => board?.moveWithin(containerId, index, delta)}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ) : (
        <ul className="space-y-1">
          {rows.map((field, index) => (
            <li key={field.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{field.label}</span>
              <span className="flex gap-1">
                <Button type="button" variant="ghost" className="min-h-[36px] px-2" aria-label={labels.moveUp.replace("{{label}}", field.label)} disabled={index === 0} onClick={() => move(field.id, -1)}>
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </Button>
                <Button type="button" variant="ghost" className="min-h-[36px] px-2" aria-label={labels.moveDown.replace("{{label}}", field.label)} disabled={index === rows.length - 1} onClick={() => move(field.id, 1)}>
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant={adding ? "ghost" : "primary"} className="min-h-[36px]" aria-expanded={adding} onClick={() => setAdding((open) => !open)}>
        {adding ? <X className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {adding ? labels.cancel : labels.addField}
      </Button>
      {adding ? (
        <EventFormFieldAddPanel
          locale={locale}
          eventId={eventId}
          nextPosition={nextPosition}
          flowId={flow.id}
          labels={addFieldLabels}
          onAdded={() => setAdding(false)}
        />
      ) : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </section>
  );
}
